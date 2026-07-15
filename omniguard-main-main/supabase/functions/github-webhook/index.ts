import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-GitHub-Event, X-Hub-Signature-256, X-Gitlab-Event, X-Gitlab-Token, X-Event-Key"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supa = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });

async function verifySig(secret: string, body: string, sig: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hash = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)))).map(b => b.toString(16).padStart(2, "0")).join("");
  return `sha256=${hash}` === sig;
}

async function getGhToken(orgId: string): Promise<string | null> {
  const { data } = await supa.from("integrations").select("config").eq("organization_id", orgId).eq("provider", "github").eq("status", "active").maybeSingle();
  return (data?.config as Record<string, string>)?.access_token || Deno.env.get("GITHUB_TOKEN") || null;
}

async function createCheckRun(token: string, repo: string, sha: string, scanId: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/check-runs`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "OmniGuard/1.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "OmniGuard Security Scan",
        head_sha: sha,
        status: "in_progress",
        started_at: new Date().toISOString(),
        output: {
          title: "Scanning for vulnerabilities…",
          summary: `OmniGuard is running a 3-layer AI security scan (ID: ${scanId}).`
        }
      }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.id;
  } catch { return null; }
}

async function updateCheckRun(token: string, repo: string, checkId: number, findings: Record<string, number>, failOn: string): Promise<void> {
  const blocking = failOn === "critical" ? findings.critical > 0 : failOn === "high" ? (findings.critical + findings.high) > 0 : findings.total > 0;
  const title = blocking ? `${findings.critical} critical · ${findings.high} high · merge blocked` : findings.total > 0 ? `${findings.total} findings (none blocking)` : "✓ No security issues";
  const summary = `| Severity | Count |\n|---|---|\n| Critical | ${findings.critical} |\n| High | ${findings.high} |\n| Medium | ${findings.medium} |\n| Low | ${findings.low} |\n\n${blocking ? "⛔ Merge blocked — resolve critical/high findings first." : "✅ Safe to merge."}`;
  try {
    await fetch(`https://api.github.com/repos/${repo}/check-runs/${checkId}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "OmniGuard/1.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
        conclusion: blocking ? "action_required" : "success",
        output: { title, summary }
      }),
      signal: AbortSignal.timeout(10_000)
    });
  } catch { /* non-fatal */ }
}

async function pollAndUpdate(token: string, repo: string, checkId: number, scanId: string, failOn: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < 180_000) {
    await new Promise(r => setTimeout(r, 5_000));
    const { data: scan } = await supa.from("scans").select("status, summary").eq("id", scanId).single();
    if (scan?.status === "completed" || scan?.status === "failed") {
      const s = (scan.summary as Record<string, number>) || {};
      await updateCheckRun(token, repo, checkId, { total: s.total || 0, critical: s.critical || 0, high: s.high || 0, medium: s.medium || 0, low: s.low || 0 }, failOn);
      return;
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const ghEvent = req.headers.get("X-GitHub-Event");
  const glEvent = req.headers.get("X-Gitlab-Event");
  const bbEvent = req.headers.get("X-Event-Key");

  const payload = await req.text();
  let body: any = {};
  try { body = JSON.parse(payload); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  let provider: "github" | "gitlab" | "bitbucket" = "github";
  let eventName = "";
  let repoId = "";
  let branch = "";
  let commitSha = "";
  let commitMessage = "";
  let author = "";
  let action = "";
  let prNumber: number | null = null;
  let isPing = false;

  // 1. Detect Webhook Source
  if (ghEvent) {
    provider = "github";
    eventName = ghEvent;
    isPing = eventName === "ping";
    repoId = String(body.repository?.id || "");
    action = body.action || "";
    author = body.sender?.login || "";
    
    if (eventName === "push") {
      branch = body.ref?.replace("refs/heads/", "") || "";
      commitSha = body.after || "";
      commitMessage = body.commits?.[0]?.message || "";
    } else if (eventName === "pull_request") {
      branch = body.pull_request?.head?.ref || "";
      commitSha = body.pull_request?.head?.sha || "";
      commitMessage = `PR #${body.pull_request?.number}: ${body.pull_request?.title || ""}`;
      prNumber = body.pull_request?.number || null;
    }
  } else if (glEvent) {
    provider = "gitlab";
    eventName = glEvent;
    repoId = String(body.project?.id || body.project_id || "");
    author = body.user_username || body.user?.username || "";

    if (eventName === "Push Hook") {
      branch = body.ref?.replace("refs/heads/", "") || "";
      commitSha = body.after || "";
      commitMessage = body.commits?.[0]?.message || "";
    } else if (eventName === "Merge Request Hook") {
      branch = body.object_attributes?.source_branch || "";
      commitSha = body.object_attributes?.last_commit?.id || "";
      commitMessage = `MR #${body.object_attributes?.iid}: ${body.object_attributes?.title || ""}`;
      prNumber = body.object_attributes?.iid || null;
      action = body.object_attributes?.action || "";
    }
  } else if (bbEvent) {
    provider = "bitbucket";
    eventName = bbEvent;
    repoId = String(body.repository?.uuid || body.repository?.full_name || "");
    author = body.actor?.username || "";

    if (eventName === "repo:push") {
      const change = body.push?.changes?.[0];
      branch = change?.new?.name || "";
      commitSha = change?.new?.target?.hash || "";
      commitMessage = change?.new?.target?.message || "";
    } else if (eventName.startsWith("pullrequest:")) {
      branch = body.pullrequest?.source?.branch?.name || "";
      commitSha = body.pullrequest?.source?.commit?.hash || "";
      commitMessage = `PR #${body.pullrequest?.id}: ${body.pullrequest?.title || ""}`;
      prNumber = body.pullrequest?.id || null;
      action = eventName.replace("pullrequest:", "");
    }
  } else {
    return new Response(JSON.stringify({ error: "Unsupported Git Provider" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (isPing) {
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    // 2. Fetch repo record matching provider + ID
    const { data: repo } = await supa.from("repositories")
      .select("id, organization_id, full_name, default_branch, webhook_secret, created_by")
      .eq("provider", provider)
      .eq("provider_id", repoId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!repo) {
      return new Response(JSON.stringify({ ok: true, message: `Repository (${provider}/${repoId}) not registered in OmniGuard` }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // 3. Verify Signature/Token
    if (repo.webhook_secret) {
      if (provider === "github") {
        const sig = req.headers.get("X-Hub-Signature-256") || "";
        if (!(await verifySig(repo.webhook_secret, payload, sig))) {
          return new Response(JSON.stringify({ error: "Invalid GitHub Signature" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
        }
      } else if (provider === "gitlab") {
        const token = req.headers.get("X-Gitlab-Token") || "";
        if (token !== repo.webhook_secret) {
          return new Response(JSON.stringify({ error: "Invalid GitLab Token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
        }
      }
    }

    let scanData: { id: string } | null = null;
    let isScanEvent = false;

    if (eventName === "push" || eventName === "Push Hook" || eventName === "repo:push") {
      if (commitSha && commitSha !== "0".repeat(40)) {
        isScanEvent = true;
      }
    } else if (
      (provider === "github" && eventName === "pull_request" && ["opened", "synchronize", "reopened"].includes(action)) ||
      (provider === "gitlab" && eventName === "Merge Request Hook" && ["open", "reopen", "update"].includes(action)) ||
      (provider === "bitbucket" && ["created", "updated"].includes(action))
    ) {
      isScanEvent = true;
    }

    if (isScanEvent) {
      const { data: scan } = await supa.from("scans").insert({
        repository_id: repo.id,
        organization_id: repo.organization_id,
        status: "queued",
        trigger: prNumber ? "pull_request" : "webhook",
        branch,
        commit_sha: commitSha,
        commit_message: commitMessage.slice(0, 200),
        commit_author: author,
        created_by: repo.created_by,
        metadata: prNumber ? { pr_number: prNumber } : {}
      }).select().single();
      scanData = scan;

      // GitHub commit check run integration
      if (provider === "github" && prNumber && scan) {
        const token = await getGhToken(repo.organization_id);
        if (token) {
          const checkId = await createCheckRun(token, repo.full_name, commitSha, scan.id);
          if (checkId) {
            const { data: org } = await supa.from("organizations").select("settings").eq("id", repo.organization_id).single();
            const failOn = (org?.settings as Record<string, string>)?.pr_fail_on || "high";
            pollAndUpdate(token, repo.full_name, checkId, scan.id, failOn).catch(() => {});
          }
        }
      }
    }

    // 4. Trigger process queued runs on scanner engine
    if (scanData) {
      fetch(`${supabaseUrl}/functions/v1/scan-worker/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({ scan_id: scanData.id, repository_id: repo.id, organization_id: repo.organization_id })
      }).catch(() => {});

      await supa.from("audit_logs").insert({
        organization_id: repo.organization_id,
        action: "webhook_received",
        resource_type: "scan",
        resource_id: scanData.id,
        resource_name: repo.full_name,
        metadata: { event: eventName, provider }
      });
    }

    return new Response(JSON.stringify({ ok: true, scan_id: scanData?.id }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});

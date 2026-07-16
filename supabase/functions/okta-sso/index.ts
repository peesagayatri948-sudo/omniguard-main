import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── GET /okta-sso/initiate — Start Okta SSO flow ──
    if (path === "initiate" && req.method === "GET") {
      const orgId = url.searchParams.get("org_id");
      if (!orgId) return jsonError(400, "Missing org_id");

      // Fetch org's Okta config from DB
      const orgRes = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}&select=okta_config`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const orgData = await orgRes.json();
      if (!orgData[0]?.okta_config) return jsonError(400, "Okta not configured for this organization");

      const okta = orgData[0].okta_config;
      const state = crypto.randomUUID();

      // Build Okta authorize URL
      const authUrl = new URL(`${okta.issuer}/v1/authorize`);
      authUrl.searchParams.set("client_id", okta.clientId);
      authUrl.searchParams.set("redirect_uri", okta.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email groups");
      authUrl.searchParams.set("state", state);

      return jsonResponse({
        authorize_url: authUrl.toString(),
        state,
        domain: okta.domain,
      });
    }

    // ── POST /okta-sso/callback — Handle Okta callback ──
    if (path === "callback" && req.method === "POST") {
      const { code, state, org_id, redirect_uri } = await req.json();
      if (!code || !org_id) return jsonError(400, "Missing code or org_id");

      // Fetch org's Okta config
      const orgRes = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${org_id}&select=okta_config,name`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const orgData = await orgRes.json();
      if (!orgData[0]?.okta_config) return jsonError(400, "Okta not configured");

      const okta = orgData[0].okta_config;
      const orgName = orgData[0].name;

      // Exchange code for tokens
      const tokenRes = await fetch(`${okta.issuer}/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: okta.clientId,
          code,
          redirect_uri: redirect_uri || okta.redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return jsonError(400, `Token exchange failed: ${err.slice(0, 200)}`);
      }

      const tokens = await tokenRes.json();

      // Fetch user info from Okta
      const userInfoRes = await fetch(`${okta.issuer}/v1/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      if (!userInfo.email) return jsonError(400, "No email in Okta user info");

      // ── Auto-provision user in Supabase if not exists ──
      // Check if user exists
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(userInfo.email)}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const usersData = await userRes.json();
      let userId: string;

      if (usersData.users && usersData.users.length > 0) {
        userId = usersData.users[0].id;
      } else if (okta.autoProvision !== false) {
        // Create user via admin API
        const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({
            email: userInfo.email,
            email_confirm: true,
            user_metadata: {
              full_name: userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim(),
              sso_provider: "okta",
              okta_groups: userInfo.groups || [],
            },
          }),
        });
        const newUser = await createRes.json();
        if (!newUser.id) return jsonError(500, "Failed to create user");
        userId = newUser.id;

        // Create user profile
        await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
          body: JSON.stringify({
            id: userId,
            full_name: userInfo.name || userInfo.email,
            avatar_url: userInfo.picture || null,
          }),
        });

        // Add user to organization with default role
        const defaultRole = okta.defaultRole || "developer";
        await fetch(`${supabaseUrl}/rest/v1/organization_members`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
          body: JSON.stringify({ organization_id: org_id, user_id: userId, role: defaultRole }),
        });
      } else {
        return jsonError(403, "User not found and auto-provision is disabled");
      }

      // Log audit event
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
        body: JSON.stringify({
          organization_id: org_id,
          user_id: userId,
          action: "okta_sso_login",
          resource_type: "auth",
          resource_id: userId,
          details: { okta_groups: userInfo.groups || [], email: userInfo.email },
        }),
      });

      return jsonResponse({
        ok: true,
        user: { id: userId, email: userInfo.email, name: userInfo.name, okta_groups: userInfo.groups || [] },
        redirect: "/app",
      });
    }

    // ── GET /okta-sso/status — Check if Okta is auto-detected from env ──
    if (path === "status" && req.method === "GET") {
      const envOktaDomain = Deno.env.get("OKTA_DOMAIN");
      const envOktaClientId = Deno.env.get("OKTA_CLIENT_ID");
      const isProduction = Deno.env.get("NODE_ENV") === "production";

      return jsonResponse({
        env_detected: !!(envOktaDomain && envOktaClientId),
        auto_enabled: isProduction && !!(envOktaDomain && envOktaClientId),
        domain: envOktaDomain || null,
        always_available_in_prod: isProduction,
      });
    }

    return jsonError(404, "Not found");
  } catch (err) {
    return jsonError(500, err.message);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  return jsonResponse({ error: message }, status);
}

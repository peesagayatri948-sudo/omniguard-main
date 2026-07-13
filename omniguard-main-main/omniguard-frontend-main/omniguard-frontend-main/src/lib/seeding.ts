import { type SupabaseClient } from '@supabase/supabase-js';

export async function seedDatabaseIfEmpty(supabase: SupabaseClient, userId: string) {
  try {
    // Check if user profile exists, create if not
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user.email || 'user@example.com';
      await supabase.from('user_profiles').insert({
        id: userId,
        email,
        first_name: email.split('@')[0],
        last_name: 'User',
        preferences: {},
      });
    }

    // Check if user has an organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    let orgId: string;

    if (!member) {
      // Create organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: 'Experian',
          slug: 'experian-' + Math.floor(Math.random() * 1000),
          plan: 'enterprise',
          settings: {
            policies: {
              'shutdown-ssh': true,
              'shutdown-rdp': false,
              'shutdown-public-db': true,
              'shutdown-iam': false,
            }
          },
          created_by: userId,
        })
        .select()
        .single();

      if (orgErr || !org) return;
      orgId = org.id;

      // Link member as owner
      await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: userId,
        role: 'owner',
        status: 'active',
      });
    } else {
      orgId = member.organization_id;
    }

    // Check if repository exists
    const { data: repos } = await supabase
      .from('repositories')
      .select('id')
      .eq('organization_id', orgId);

    let repoId: string;

    if (!repos || repos.length === 0) {
      const { data: newRepo, error: repoErr } = await supabase
        .from('repositories')
        .insert({
          organization_id: orgId,
          provider: 'local',
          provider_id: 'local-trader-bot',
          owner: 'experian',
          name: 'trader_bot',
          full_name: 'experian/trader_bot',
          description: 'High-frequency trading bot with automated strategy execution.',
          default_branch: 'main',
          visibility: 'private',
          language: 'Python',
          risk_score: 8.5,
          is_active: true,
          created_by: userId,
        })
        .select()
        .single();

      if (repoErr || !newRepo) return;
      repoId = newRepo.id;
    } else {
      repoId = repos[0].id;
    }

    // Check if scans exist
    const { data: scans } = await supabase
      .from('scans')
      .select('id')
      .eq('repository_id', repoId);

    let scanId: string;

    if (!scans || scans.length === 0) {
      const { data: newScan, error: scanErr } = await supabase
        .from('scans')
        .insert({
          repository_id: repoId,
          organization_id: orgId,
          status: 'completed',
          trigger: 'manual',
          scan_type: 'full',
          branch: 'main',
          commit_sha: '8a9c3d4f5e6b7a8d9e0f',
          commit_message: 'Deploy paper trading runner with pickle strategy loader',
          commit_author: 'Jane CISO',
          summary: { files_scanned: 75, critical: 1, high: 2, medium: 0 },
        })
        .select()
        .single();

      if (scanErr || !newScan) return;
      scanId = newScan.id;
    } else {
      scanId = scans[0].id;
    }

    // Check if findings exist
    const { data: existingFindings } = await supabase
      .from('findings')
      .select('id')
      .eq('scan_id', scanId);

    if (!existingFindings || existingFindings.length === 0) {
      await supabase.from('findings').insert([
        {
          organization_id: orgId,
          scan_id: scanId,
          repository_id: repoId,
          scanner: 'sast',
          category: 'deserialization',
          severity: 'critical',
          title: 'Unsafe Deserialization detected',
          description: 'Using pickle.load() on untrusted network streams allows arbitrary system command execution.',
          evidence: 'pickle.load(stream)',
          file_path: 'paper_trader_runner.py',
          line_start: 201,
          rule_id: 'SAST-DESER-001',
          rule_name: 'Unsafe Pickle Deserialization',
          owasp: ['A08:2021-Software and Data Integrity Failures'],
          mitre: ['T1190'],
          remediation: 'Use json.loads() or safeyaml to deserialize incoming stream payloads.',
          status: 'open',
        },
        {
          organization_id: orgId,
          scan_id: scanId,
          repository_id: repoId,
          scanner: 'iac',
          category: 'drift',
          severity: 'high',
          title: 'Permissive Cloud Security Group (Port 22 Open)',
          description: 'Inbound port 22 (SSH) is wide open to the internet (0.0.0.0/0). This violates company security policy SEC-001.',
          evidence: 'ingress { from_port = 22, to_port = 22, cidr_blocks = ["0.0.0.0/0"] }',
          file_path: 'terraform/security_groups.tf',
          line_start: 45,
          rule_id: 'IAC-SG-002',
          rule_name: 'SSH Open To Internet',
          mitre: ['T1043'],
          remediation: 'Restrict CIDR blocks to corporate office range or VPN endpoints.',
          status: 'open',
        }
      ]);
    }

    // Check if audit logs exist
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('organization_id', orgId);

    if (!auditLogs || auditLogs.length === 0) {
      await supabase.from('audit_logs').insert([
        {
          organization_id: orgId,
          user_id: userId,
          action: 'graph_delta',
          resource_type: 'nexus_graph',
          resource_name: 'experian/trader_bot',
          new_values: { change: 'Added local Edge node: Hardware Gateway' },
          metadata: { details: 'Discovered during continuous architecture monitoring' },
        },
        {
          organization_id: orgId,
          user_id: userId,
          action: 'mcp_intercept',
          resource_type: 'ai_guardrail',
          resource_name: 'Claude Code Agent',
          new_values: { file: 'paper_trader_runner.py', rule: 'SAST-DESER-001' },
          metadata: { message: 'Blocked AI from writing insecure pickle deserializer' },
        }
      ]);
    }
  } catch (e) {
    console.error('Seeding error:', e);
  }
}

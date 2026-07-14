-- OmniGuard Full Rebuild — Migration 005: Extensions + RPC Functions
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE policy_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE OR REPLACE FUNCTION check_rate_limit(p_key text, p_window_seconds integer DEFAULT 60, p_max_count integer DEFAULT 100)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count integer; v_window timestamptz;
BEGIN
  v_window := now() - (p_window_seconds || ' seconds')::interval;
  SELECT count(*) INTO v_count FROM rate_limit_counters WHERE key = p_key AND window_start >= v_window;
  IF v_count >= p_max_count THEN RETURN false; END IF;
  INSERT INTO rate_limit_counters (key, window_start, count) VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET count = rate_limit_counters.count + 1,
    window_start = CASE WHEN rate_limit_counters.window_start < v_window THEN now() ELSE rate_limit_counters.window_start END;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION claim_next_scan(p_worker_id text)
RETURNS TABLE(id uuid, organization_id uuid, repository_id uuid, scan_type text, branch text, trigger scan_trigger, metadata jsonb)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_scan record;
BEGIN
  UPDATE scans SET status = 'running', worker_id = p_worker_id, started_at = now()
  WHERE id = (SELECT id FROM scans WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING * INTO v_scan;
  IF v_scan IS NOT NULL THEN
    RETURN QUERY SELECT v_scan.id, v_scan.organization_id, v_scan.repository_id, v_scan.scan_type, v_scan.branch, v_scan.trigger, v_scan.metadata;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION match_policy_chunks(p_org_id uuid, p_query_embedding vector(1536), p_match_count integer DEFAULT 5)
RETURNS TABLE(id uuid, policy_id uuid, chunk_index integer, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT pc.id, pc.policy_id, pc.chunk_index, pc.content, pc.metadata,
    1 - (pc.embedding <=> p_query_embedding) AS similarity
  FROM policy_chunks pc WHERE pc.organization_id = p_org_id AND pc.embedding IS NOT NULL
  ORDER BY pc.embedding <=> p_query_embedding LIMIT p_match_count;
END; $$;

CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id uuid)
RETURNS TABLE(organization_id uuid, name text, slug text, plan org_plan, role member_role, status member_status)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT o.id, o.name, o.slug, o.plan, om.role, om.status
  FROM organization_members om JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = p_user_id AND om.status = 'active' ORDER BY o.created_at;
END; $$;

CREATE OR REPLACE FUNCTION get_org_member_role(p_org_id uuid, p_user_id uuid)
RETURNS member_role LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role member_role;
BEGIN
  SELECT role INTO v_role FROM organization_members WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active';
  RETURN v_role;
END; $$;

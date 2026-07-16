-- ============================================================================
-- OmniGuard v2.2.5 — Migration 009: RLS Policies for v2.2.5 tables
-- ============================================================================

-- semantic_findings
CREATE POLICY "select_semantic_findings" ON semantic_findings FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));
CREATE POLICY "insert_semantic_findings" ON semantic_findings FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));
CREATE POLICY "update_semantic_findings" ON semantic_findings FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));
CREATE POLICY "delete_semantic_findings" ON semantic_findings FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- audit_clauses
CREATE POLICY "select_audit_clauses" ON audit_clauses FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));
CREATE POLICY "insert_audit_clauses" ON audit_clauses FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));
CREATE POLICY "delete_audit_clauses" ON audit_clauses FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- graph_snapshots
CREATE POLICY "select_graph_snapshots" ON graph_snapshots FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));
CREATE POLICY "insert_graph_snapshots" ON graph_snapshots FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));
CREATE POLICY "delete_graph_snapshots" ON graph_snapshots FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- scan_events
CREATE POLICY "select_scan_events" ON scan_events FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));
CREATE POLICY "insert_scan_events" ON scan_events FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));
CREATE POLICY "delete_scan_events" ON scan_events FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- RPC: get_latest_graph_snapshot
-- Returns the most recent graph snapshot for a repo, per user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_latest_graph_snapshot(
  p_org_id  uuid,
  p_repo_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  nodes jsonb,
  edges jsonb,
  clusters jsonb,
  metrics jsonb,
  node_count integer,
  edge_count integer,
  risk_delta integer,
  added_nodes jsonb,
  removed_nodes jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.id, gs.nodes, gs.edges, gs.clusters, gs.metrics,
    gs.node_count, gs.edge_count, gs.risk_delta,
    gs.added_nodes, gs.removed_nodes, gs.created_at
  FROM graph_snapshots gs
  WHERE gs.organization_id = p_org_id
    AND gs.repository_id = p_repo_id
    AND (p_user_id IS NULL OR gs.user_id = p_user_id)
  ORDER BY gs.created_at DESC
  LIMIT 1;
END;
$$;

-- ============================================================================
-- RPC: get_compliance_matrix
-- Returns a matrix of findings mapped to compliance frameworks
-- ============================================================================
CREATE OR REPLACE FUNCTION get_compliance_matrix(
  p_org_id  uuid,
  p_scan_id uuid DEFAULT NULL
)
RETURNS TABLE(
  framework text,
  clause_id text,
  clause_title text,
  finding_count bigint,
  critical_count bigint,
  high_count bigint,
  medium_count bigint,
  low_count bigint,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.framework,
    ac.clause_id,
    ac.clause_title,
    count(*) AS finding_count,
    count(*) FILTER (WHERE ac.mapped_severity = 'critical') AS critical_count,
    count(*) FILTER (WHERE ac.mapped_severity = 'high') AS high_count,
    count(*) FILTER (WHERE ac.mapped_severity = 'medium') AS medium_count,
    count(*) FILTER (WHERE ac.mapped_severity = 'low') AS low_count,
    CASE
      WHEN count(*) FILTER (WHERE ac.mapped_severity IN ('critical','high')) > 0 THEN 'non_compliant'
      WHEN count(*) > 0 THEN 'partially_compliant'
      ELSE 'compliant'
    END AS status
  FROM audit_clauses ac
  WHERE ac.organization_id = p_org_id
    AND (p_scan_id IS NULL OR ac.scan_id = p_scan_id)
  GROUP BY ac.framework, ac.clause_id, ac.clause_title
  ORDER BY ac.framework, ac.clause_id;
END;
$$;

-- ============================================================================
-- RPC: get_scan_timeline
-- Returns real-time scan events for dashboard live updates
-- ============================================================================
CREATE OR REPLACE FUNCTION get_scan_timeline(
  p_org_id  uuid,
  p_scan_id uuid,
  p_after   timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  event_type text,
  event_data jsonb,
  event_message text,
  severity finding_severity,
  elapsed_ms integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id, se.event_type, se.event_data, se.event_message,
    se.severity, se.elapsed_ms, se.created_at
  FROM scan_events se
  WHERE se.organization_id = p_org_id
    AND se.scan_id = p_scan_id
    AND (p_after IS NULL OR se.created_at > p_after)
  ORDER BY se.created_at ASC;
END;
$$;

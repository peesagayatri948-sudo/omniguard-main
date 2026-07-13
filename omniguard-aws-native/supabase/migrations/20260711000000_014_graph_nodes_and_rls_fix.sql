-- OmniGuard v1.6 — Graph Nodes table (separate from policy_chunks)
-- and fix RLS to allow daemon (anon) to insert findings

-- 1. Create graph_nodes table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  type text NOT NULL DEFAULT 'leaf',
  depth integer NOT NULL DEFAULT 0,
  parent text,
  repository_name text NOT NULL,
  imports jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, node_id)
);

ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

-- Allow anon to read
CREATE POLICY IF NOT EXISTS "graph_nodes_anon_select"
  ON graph_nodes FOR SELECT
  USING (true);

-- Allow anon to insert (daemon uses anon key)
CREATE POLICY IF NOT EXISTS "graph_nodes_anon_insert"
  ON graph_nodes FOR INSERT
  WITH CHECK (true);

-- Allow anon to delete
CREATE POLICY IF NOT EXISTS "graph_nodes_anon_delete"
  ON graph_nodes FOR DELETE
  USING (true);

-- Allow anon to update  
CREATE POLICY IF NOT EXISTS "graph_nodes_anon_update"
  ON graph_nodes FOR UPDATE
  USING (true);

-- 2. Fix findings RLS — allow anon insert so daemon can write findings
-- Drop overly restrictive policies
DROP POLICY IF EXISTS "findings_insert_own_org" ON findings;
DROP POLICY IF EXISTS "findings_select_own_org" ON findings;
DROP POLICY IF EXISTS "findings_update_own_org" ON findings;

-- Re-create permissive policies for daemon (anon key) inserts
CREATE POLICY IF NOT EXISTS "findings_anon_insert"
  ON findings FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "findings_anon_select"
  ON findings FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "findings_anon_update"
  ON findings FOR UPDATE
  USING (true);

-- 3. Fix audit_logs RLS — allow anon insert
DROP POLICY IF EXISTS "audit_logs_insert_own_org" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own_org" ON audit_logs;

CREATE POLICY IF NOT EXISTS "audit_logs_anon_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "audit_logs_anon_select"
  ON audit_logs FOR SELECT
  USING (true);

-- 4. Fix scans RLS — allow anon insert/update
DROP POLICY IF EXISTS "scans_insert_own_org" ON scans;
DROP POLICY IF EXISTS "scans_update_own_org" ON scans;
DROP POLICY IF EXISTS "scans_select_own_org" ON scans;

CREATE POLICY IF NOT EXISTS "scans_anon_insert"
  ON scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "scans_anon_update"
  ON scans FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "scans_anon_select"
  ON scans FOR SELECT
  USING (true);

-- 5. Index for fast graph node lookup
CREATE INDEX IF NOT EXISTS idx_graph_nodes_org ON graph_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_repo ON graph_nodes(repository_name);
CREATE INDEX IF NOT EXISTS idx_findings_org ON findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);

-- 6. Fix repositories RLS — allow daemon (anon key) to insert/select repositories
DROP POLICY IF EXISTS "repositories_insert_own_org" ON repositories;
DROP POLICY IF EXISTS "repositories_select_own_org" ON repositories;
DROP POLICY IF EXISTS "repositories_update_own_org" ON repositories;

CREATE POLICY "repositories_anon_insert" ON repositories FOR INSERT WITH CHECK (true);
CREATE POLICY "repositories_anon_select" ON repositories FOR SELECT USING (true);
CREATE POLICY "repositories_anon_update" ON repositories FOR UPDATE USING (true);
CREATE POLICY "repositories_anon_delete" ON repositories FOR DELETE USING (true);

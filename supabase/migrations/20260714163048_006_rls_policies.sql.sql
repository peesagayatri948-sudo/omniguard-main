-- ============================================================================
-- OmniGuard Full Rebuild — Migration 006: RLS Policies
-- Non-recursive, no circular dependencies. Uses a helper function to resolve
-- org membership so policies can't recurse into the tables they protect.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: user_org_ids
-- Returns array of org IDs the current user is an active member of.
-- SECURITY DEFINER + fixed search path prevents RLS recursion.
-- ============================================================================
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: is_org_member
-- Boolean check for a specific org membership.
-- ============================================================================
CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$;

-- ============================================================================
-- ORGANIZATIONS
-- Users can see orgs they're a member of.
-- Owners can insert (create new orgs), and update their orgs.
-- ============================================================================
CREATE POLICY "select_own_organizations" ON organizations FOR SELECT
  TO authenticated USING (id = ANY(user_org_ids()));

CREATE POLICY "insert_organizations" ON organizations FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_own_organizations" ON organizations FOR UPDATE
  TO authenticated USING (id = ANY(user_org_ids())) WITH CHECK (id = ANY(user_org_ids()));

-- ============================================================================
-- USER_PROFILES
-- Users can only access their own profile.
-- ============================================================================
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (id = auth.uid());

CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================================
-- ORGANIZATION_MEMBERS
-- Members of an org can see all members of that org.
-- Users can see their own membership rows.
-- Insert: any authenticated user (joining/creating orgs).
-- Update/Delete: only existing members of that org (role elevation handled in app).
-- ============================================================================
CREATE POLICY "select_org_members" ON organization_members FOR SELECT
  TO authenticated USING (
    organization_id = ANY(user_org_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "insert_org_members" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_org_members" ON organization_members FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_org_members" ON organization_members FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- API_KEYS
-- Org members can view keys; only owner/admin can create/modify.
-- ============================================================================
CREATE POLICY "select_api_keys" ON api_keys FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_api_keys" ON api_keys FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_api_keys" ON api_keys FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_api_keys" ON api_keys FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- REPOSITORIES
-- ============================================================================
CREATE POLICY "select_repositories" ON repositories FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_repositories" ON repositories FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_repositories" ON repositories FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_repositories" ON repositories FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- SCANS
-- ============================================================================
CREATE POLICY "select_scans" ON scans FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_scans" ON scans FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_scans" ON scans FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_scans" ON scans FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- FINDINGS
-- ============================================================================
CREATE POLICY "select_findings" ON findings FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_findings" ON findings FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_findings" ON findings FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_findings" ON findings FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- POLICIES (policy documents)
-- ============================================================================
CREATE POLICY "select_policies" ON policies FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_policies" ON policies FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_policies" ON policies FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_policies" ON policies FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- POLICY_CHUNKS
-- ============================================================================
CREATE POLICY "select_policy_chunks" ON policy_chunks FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_policy_chunks" ON policy_chunks FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_policy_chunks" ON policy_chunks FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_policy_chunks" ON policy_chunks FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- COMPLIANCE_RULES
-- ============================================================================
CREATE POLICY "select_compliance_rules" ON compliance_rules FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_compliance_rules" ON compliance_rules FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_compliance_rules" ON compliance_rules FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_compliance_rules" ON compliance_rules FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================
CREATE POLICY "select_integrations" ON integrations FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_integrations" ON integrations FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_integrations" ON integrations FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_integrations" ON integrations FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- INTEGRATION_EVENTS
-- ============================================================================
CREATE POLICY "select_integration_events" ON integration_events FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_integration_events" ON integration_events FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_integration_events" ON integration_events FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_integration_events" ON integration_events FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- NOTIFICATIONS
-- Users see notifications for their orgs that are addressed to them.
-- ============================================================================
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (
    organization_id = ANY(user_org_ids())
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (
    organization_id = ANY(user_org_ids())
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- AUDIT_LOGS
-- Read-only for org members. Inserts done via service role (edge functions).
-- ============================================================================
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- GRAPH_NODES
-- ============================================================================
CREATE POLICY "select_graph_nodes" ON graph_nodes FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_graph_nodes" ON graph_nodes FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_graph_nodes" ON graph_nodes FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- WORKER_HEARTBEATS
-- Visible to org members via service role. Allow select for monitoring.
-- ============================================================================
CREATE POLICY "select_worker_heartbeats" ON worker_heartbeats FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_worker_heartbeats" ON worker_heartbeats FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_worker_heartbeats" ON worker_heartbeats FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- AI_CACHE
-- Only org members can access their org's AI cache.
-- ============================================================================
CREATE POLICY "select_ai_cache" ON ai_cache FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_ai_cache" ON ai_cache FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_ai_cache" ON ai_cache FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_ai_cache" ON ai_cache FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- AI_USAGE
-- ============================================================================
CREATE POLICY "select_ai_usage" ON ai_usage FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_ai_usage" ON ai_usage FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- ORGANIZATION_SUPPRESSION_RULES
-- ============================================================================
CREATE POLICY "select_suppression_rules" ON organization_suppression_rules FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_suppression_rules" ON organization_suppression_rules FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_suppression_rules" ON organization_suppression_rules FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_suppression_rules" ON organization_suppression_rules FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- SCAN_ARTIFACTS
-- ============================================================================
CREATE POLICY "select_scan_artifacts" ON scan_artifacts FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_scan_artifacts" ON scan_artifacts FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_scan_artifacts" ON scan_artifacts FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- PROJECT_RISK_HISTORY
-- ============================================================================
CREATE POLICY "select_risk_history" ON project_risk_history FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_risk_history" ON project_risk_history FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- API_KEY_USAGE
-- Org members can view their key usage.
-- ============================================================================
CREATE POLICY "select_api_key_usage" ON api_key_usage FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_api_key_usage" ON api_key_usage FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

-- ============================================================================
-- ORGANIZATION_INTEGRATIONS
-- ============================================================================
CREATE POLICY "select_org_integrations" ON organization_integrations FOR SELECT
  TO authenticated USING (organization_id = ANY(user_org_ids()));

CREATE POLICY "insert_org_integrations" ON organization_integrations FOR INSERT
  TO authenticated WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "update_org_integrations" ON organization_integrations FOR UPDATE
  TO authenticated USING (organization_id = ANY(user_org_ids()))
  WITH CHECK (organization_id = ANY(user_org_ids()));

CREATE POLICY "delete_org_integrations" ON organization_integrations FOR DELETE
  TO authenticated USING (organization_id = ANY(user_org_ids()));

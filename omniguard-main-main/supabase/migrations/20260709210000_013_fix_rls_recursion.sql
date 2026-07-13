-- Fix infinite recursion in organization_members policies by using helper functions
-- helper functions (is_org_member and is_org_admin) are SECURITY DEFINER and bypass RLS to prevent recursion.

-- 1. SELECT policy
DROP POLICY IF EXISTS "member_select_org_member" ON organization_members;
CREATE POLICY "member_select_org_member" ON organization_members FOR SELECT
  TO authenticated
  USING (
    is_org_member(organization_id, auth.uid())
  );

-- 2. INSERT policy
DROP POLICY IF EXISTS "member_insert_admin" ON organization_members;
CREATE POLICY "member_insert_admin" ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creation of the first membership (when org is created)
    -- or if the executor is an admin of the target organization.
    (NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id))
    OR is_org_admin(organization_id, auth.uid())
  );

-- 3. UPDATE policy
DROP POLICY IF EXISTS "member_update_admin" ON organization_members;
CREATE POLICY "member_update_admin" ON organization_members FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  );

-- 4. DELETE policy
DROP POLICY IF EXISTS "member_delete_admin" ON organization_members;
CREATE POLICY "member_delete_admin" ON organization_members FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  );

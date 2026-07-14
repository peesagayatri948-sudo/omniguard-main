-- ============================================================================
-- OmniGuard Full Rebuild — Migration 001: Extensions + Core Tables
-- Generated from code audit. Fresh schema, no backwards compatibility.
-- ============================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE org_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'manager', 'developer', 'viewer');
CREATE TYPE member_status AS ENUM ('active', 'pending', 'declined', 'invited');
CREATE TYPE finding_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE finding_status AS ENUM ('open', 'resolved', 'suppressed', 'false_positive', 'in_progress');
CREATE TYPE scan_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE scan_trigger AS ENUM ('manual', 'webhook', 'scheduled', 'api', 'watch', 'ci');
CREATE TYPE integration_status AS ENUM ('active', 'disconnected', 'error', 'pending');
CREATE TYPE policy_status AS ENUM ('draft', 'approved', 'archived', 'active');
CREATE TYPE policy_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE notification_type AS ENUM ('finding', 'scan', 'system', 'integration', 'policy', 'drift', 'security');
CREATE TYPE integration_provider AS ENUM (
  'github', 'gitlab', 'bitbucket', 'azuredevops',
  'slack', 'teams', 'jira', 'servicenow', 'pagerduty',
  'linear', 'confluence', 'okta', 'vault', 'webhook', 'custom'
);
CREATE TYPE repository_visibility AS ENUM ('public', 'private', 'internal');
CREATE TYPE repository_provider AS ENUM ('github', 'gitlab', 'bitbucket', 'azuredevops', 'local');

-- ============================================================================
-- TABLE: organizations
-- ============================================================================
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  plan          org_plan NOT NULL DEFAULT 'free',
  settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  rate_limits   jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_keys_vault_id uuid,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations (slug);
CREATE INDEX idx_organizations_created_by ON organizations (created_by);

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
CREATE TABLE user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  first_name  text,
  last_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'user',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_email ON user_profiles (email);

-- ============================================================================
-- TABLE: organization_members
-- ============================================================================
CREATE TABLE organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'developer',
  status          member_status NOT NULL DEFAULT 'pending',
  invited_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON organization_members (organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members (user_id);
CREATE INDEX idx_org_members_status ON organization_members (status);

-- ============================================================================
-- TABLE: api_keys
-- ============================================================================
CREATE TABLE api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  name            text NOT NULL,
  key_prefix      text NOT NULL,
  key_hash        text NOT NULL,
  scopes          jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_org_id ON api_keys (organization_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys (key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys (is_active);
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys (key_hash);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- RLS ENABLE
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

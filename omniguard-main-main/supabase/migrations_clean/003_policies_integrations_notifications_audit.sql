-- OmniGuard Full Rebuild — Migration 003: Policies, Integrations, Notifications, Audit Logs

CREATE TABLE policies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by          uuid REFERENCES auth.users(id),
  title               text NOT NULL,
  name                text,
  description         text,
  content             text,
  category            text,
  severity            policy_severity NOT NULL DEFAULT 'medium',
  status              policy_status NOT NULL DEFAULT 'draft',
  source_type         text DEFAULT 'manual',
  policy_type         text,
  source_document_type text,
  structured_rules    jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled             boolean NOT NULL DEFAULT true,
  enforcement_mode    text DEFAULT 'advisory',
  tags                jsonb NOT NULL DEFAULT '[]'::jsonb,
  compliance_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by         uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_policies_org_id ON policies (organization_id);
CREATE INDEX idx_policies_status ON policies (status);
CREATE INDEX idx_policies_category ON policies (category);
CREATE INDEX idx_policies_deleted_at ON policies (deleted_at);
CREATE INDEX idx_policies_severity ON policies (severity);
CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE policy_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id       uuid REFERENCES policies(id) ON DELETE CASCADE,
  chunk_index     integer NOT NULL DEFAULT 0,
  content         text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_policy_chunks_org_id ON policy_chunks (organization_id);
CREATE INDEX idx_policy_chunks_policy_id ON policy_chunks (policy_id);
CREATE INDEX idx_policy_chunks_chunk_index ON policy_chunks (chunk_index);

CREATE TABLE compliance_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id         text NOT NULL,
  category        text NOT NULL,
  title           text NOT NULL,
  description     text,
  severity        finding_severity NOT NULL DEFAULT 'medium',
  pattern         text,
  clause_reference text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_compliance_rules_org_id ON compliance_rules (organization_id);
CREATE INDEX idx_compliance_rules_rule_id ON compliance_rules (rule_id);
CREATE INDEX idx_compliance_rules_category ON compliance_rules (category);

CREATE TABLE integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  name            text NOT NULL,
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          integration_status NOT NULL DEFAULT 'pending',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid REFERENCES auth.users(id),
  last_sync_at    timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_integrations_org_id ON integrations (organization_id);
CREATE INDEX idx_integrations_provider ON integrations (provider);
CREATE INDEX idx_integrations_status ON integrations (status);
CREATE TRIGGER trg_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE integration_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid REFERENCES integrations(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  event_type      text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text DEFAULT 'pending',
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_events_org_id ON integration_events (organization_id);
CREATE INDEX idx_integration_events_integration_id ON integration_events (integration_id);

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text,
  type            notification_type NOT NULL DEFAULT 'system',
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_org_id ON notifications (organization_id);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read_at ON notifications (read_at);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

CREATE TABLE audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id),
  actor           text,
  action          text NOT NULL,
  resource_type   text,
  resource_name   text,
  resource_id     text,
  target_id       text,
  entity_type     text,
  entity_id       text,
  details         jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values      jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_org_id ON audit_logs (organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs (resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

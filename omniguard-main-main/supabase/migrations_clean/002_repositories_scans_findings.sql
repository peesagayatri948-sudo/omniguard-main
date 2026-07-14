-- ============================================================================
-- OmniGuard Full Rebuild — Migration 002: Repositories, Scans, Findings
-- ============================================================================

CREATE TABLE repositories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        repository_provider NOT NULL DEFAULT 'github',
  owner           text,
  name            text NOT NULL,
  full_name       text,
  provider_id     text,
  clone_url       text,
  default_branch  text DEFAULT 'main',
  language        text,
  visibility      repository_visibility NOT NULL DEFAULT 'private',
  risk_score      integer DEFAULT 0,
  last_scan_at    timestamptz,
  last_sync_at    timestamptz,
  webhook_secret  text,
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_repositories_org_id ON repositories (organization_id);
CREATE INDEX idx_repositories_full_name ON repositories (full_name);
CREATE INDEX idx_repositories_deleted_at ON repositories (deleted_at);
CREATE UNIQUE INDEX idx_repositories_org_name ON repositories (organization_id, name) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_repositories_updated_at BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE scans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  repository_id   uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  status          scan_status NOT NULL DEFAULT 'queued',
  scan_type       text DEFAULT 'full',
  trigger         scan_trigger NOT NULL DEFAULT 'manual',
  branch          text,
  commit_sha      text,
  commit_message  text,
  commit_author   text,
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds integer,
  findings_count  integer DEFAULT 0,
  worker_id       text,
  error_message   text,
  created_by      uuid REFERENCES auth.users(id),
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_scans_org_id ON scans (organization_id);
CREATE INDEX idx_scans_repo_id ON scans (repository_id);
CREATE INDEX idx_scans_status ON scans (status);
CREATE INDEX idx_scans_created_at ON scans (created_at DESC);
CREATE TRIGGER trg_scans_updated_at BEFORE UPDATE ON scans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE findings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_id                 uuid REFERENCES scans(id) ON DELETE CASCADE,
  repository_id           uuid REFERENCES repositories(id) ON DELETE SET NULL,
  title                   text NOT NULL,
  description             text,
  severity                finding_severity NOT NULL DEFAULT 'medium',
  status                  finding_status NOT NULL DEFAULT 'open',
  risk_score              integer DEFAULT 0,
  confidence_score        numeric(3,2) DEFAULT 0.00,
  false_positive_likelihood numeric(3,2) DEFAULT 0.00,
  scanner                 text NOT NULL,
  rule_id                 text,
  rule_name               text,
  category                text,
  clause_reference        text,
  owasp                   text,
  cwe                     text,
  cvss_score              numeric(3,1),
  cve_id                  text,
  package_name            text,
  package_version         text,
  file_path               text,
  line_start              integer,
  line_end                integer,
  evidence                text,
  remediation             text,
  ai_summary              text,
  ai_remediation          text,
  ai_provider             text,
  ai_model                text,
  policy_violations       jsonb NOT NULL DEFAULT '[]'::jsonb,
  business_impact         text,
  suggested_commit        text,
  "references"            jsonb NOT NULL DEFAULT '[]'::jsonb,
  fingerprint             text,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolution_note         text,
  suppress_reason         text,
  suppression_note        text,
  assigned_to             uuid REFERENCES auth.users(id),
  resolved_by             uuid REFERENCES auth.users(id),
  suppressed_by           uuid REFERENCES auth.users(id),
  resolved_at             timestamptz,
  suppressed_at           timestamptz,
  read_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_findings_org_id ON findings (organization_id);
CREATE INDEX idx_findings_scan_id ON findings (scan_id);
CREATE INDEX idx_findings_repo_id ON findings (repository_id);
CREATE INDEX idx_findings_severity ON findings (severity);
CREATE INDEX idx_findings_status ON findings (status);
CREATE INDEX idx_findings_rule_id ON findings (rule_id);
CREATE INDEX idx_findings_category ON findings (category);
CREATE INDEX idx_findings_created_at ON findings (created_at DESC);
CREATE INDEX idx_findings_fingerprint ON findings (fingerprint);
CREATE INDEX idx_findings_severity_status ON findings (severity, status);

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

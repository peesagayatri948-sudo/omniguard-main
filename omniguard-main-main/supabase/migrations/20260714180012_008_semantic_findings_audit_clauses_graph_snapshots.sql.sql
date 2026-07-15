-- ============================================================================
-- OmniGuard v2.2.5 — Migration 008: Semantic Findings, Audit Clauses, Graph Snapshots
-- ============================================================================

-- ============================================================================
-- TABLE: semantic_findings
-- AI-powered semantic vulnerability findings with deterministic clause mapping
-- ============================================================================
CREATE TABLE semantic_findings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_id                 uuid REFERENCES scans(id) ON DELETE CASCADE,
  finding_id              uuid REFERENCES findings(id) ON DELETE CASCADE,
  repository_id           uuid REFERENCES repositories(id) ON DELETE SET NULL,

  -- Semantic analysis
  semantic_type           text NOT NULL,
  semantic_description    text NOT NULL,
  semantic_category       text NOT NULL,
  confidence              numeric(5,2) NOT NULL DEFAULT 0.00,
  risk_weight             numeric(5,2) NOT NULL DEFAULT 0.00,

  -- Code context
  code_snippet            text,
  data_flow               jsonb NOT NULL DEFAULT '[]'::jsonb,
  control_flow            jsonb NOT NULL DEFAULT '[]'::jsonb,
  taint_source            text,
  taint_sink              text,
  taint_path              jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- AI metadata
  ai_provider             text NOT NULL,
  ai_model                text NOT NULL,
  ai_tokens_used          integer DEFAULT 0,
  ai_latency_ms           integer DEFAULT 0,
  ai_prompt_hash          text,
  analysis_tier           text NOT NULL DEFAULT 'semantic',

  -- Resolution
  status                  finding_status NOT NULL DEFAULT 'open',
  resolved_by             uuid REFERENCES auth.users(id),
  resolved_at             timestamptz,

  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_semantic_findings_org_id ON semantic_findings (organization_id);
CREATE INDEX idx_semantic_findings_scan_id ON semantic_findings (scan_id);
CREATE INDEX idx_semantic_findings_finding_id ON semantic_findings (finding_id);
CREATE INDEX idx_semantic_findings_semantic_type ON semantic_findings (semantic_type);
CREATE INDEX idx_semantic_findings_confidence ON semantic_findings (confidence DESC);
CREATE INDEX idx_semantic_findings_status ON semantic_findings (status);

-- ============================================================================
-- TABLE: audit_clauses
-- Deterministic mapping of each detected weakness to exact compliance clauses
-- ============================================================================
CREATE TABLE audit_clauses (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finding_id              uuid REFERENCES findings(id) ON DELETE CASCADE,
  semantic_finding_id     uuid REFERENCES semantic_findings(id) ON DELETE CASCADE,
  scan_id                 uuid REFERENCES scans(id) ON DELETE CASCADE,

  -- Clause mapping
  framework               text NOT NULL,
  clause_id               text NOT NULL,
  clause_title            text NOT NULL,
  clause_text             text,
  clause_section          text,
  clause_url              text,

  -- Deterministic evidence
  evidence_type           text NOT NULL,
  evidence_line_start     integer,
  evidence_line_end       integer,
  evidence_snippet        text,
  evidence_hash           text NOT NULL,

  -- Severity mapping
  mapped_severity         finding_severity NOT NULL DEFAULT 'medium',
  remediation_priority    integer DEFAULT 5,

  -- AI verification
  ai_verified             boolean NOT NULL DEFAULT false,
  ai_provider             text,
  ai_model                text,
  ai_confidence           numeric(5,2) DEFAULT 0.00,

  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_clauses_org_id ON audit_clauses (organization_id);
CREATE INDEX idx_audit_clauses_finding_id ON audit_clauses (finding_id);
CREATE INDEX idx_audit_clauses_semantic_finding_id ON audit_clauses (semantic_finding_id);
CREATE INDEX idx_audit_clauses_framework ON audit_clauses (framework);
CREATE INDEX idx_audit_clauses_clause_id ON audit_clauses (clause_id);
CREATE INDEX idx_audit_clauses_evidence_hash ON audit_clauses (evidence_hash);

-- ============================================================================
-- TABLE: graph_snapshots
-- Per-user architecture graph snapshots for diff tracking
-- ============================================================================
CREATE TABLE graph_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  repository_id           uuid REFERENCES repositories(id) ON DELETE CASCADE,
  scan_id                 uuid REFERENCES scans(id) ON DELETE SET NULL,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Graph data
  snapshot_type           text NOT NULL DEFAULT 'full',
  nodes                   jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges                   jsonb NOT NULL DEFAULT '[]'::jsonb,
  clusters                jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics                 jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Diff tracking
  previous_snapshot_id    uuid REFERENCES graph_snapshots(id),
  added_nodes             jsonb NOT NULL DEFAULT '[]'::jsonb,
  removed_nodes           jsonb NOT NULL DEFAULT '[]'::jsonb,
  added_edges             jsonb NOT NULL DEFAULT '[]'::jsonb,
  removed_edges           jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_delta              integer DEFAULT 0,

  -- Metadata
  node_count              integer DEFAULT 0,
  edge_count              integer DEFAULT 0,
  max_depth               integer DEFAULT 0,
  cyclomatic_complexity   integer DEFAULT 0,

  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_graph_snapshots_org_id ON graph_snapshots (organization_id);
CREATE INDEX idx_graph_snapshots_repo_id ON graph_snapshots (repository_id);
CREATE INDEX idx_graph_snapshots_user_id ON graph_snapshots (user_id);
CREATE INDEX idx_graph_snapshots_scan_id ON graph_snapshots (scan_id);
CREATE INDEX idx_graph_snapshots_created_at ON graph_snapshots (created_at DESC);

-- ============================================================================
-- TABLE: scan_events
-- Real-time scan event log for dashboard live updates
-- ============================================================================
CREATE TABLE scan_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_id                 uuid REFERENCES scans(id) ON DELETE CASCADE,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  event_type              text NOT NULL,
  event_data              jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_message           text,
  severity                finding_severity,

  -- Performance tracking
  elapsed_ms              integer,
  memory_mb               numeric(8,2),

  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_events_org_id ON scan_events (organization_id);
CREATE INDEX idx_scan_events_scan_id ON scan_events (scan_id);
CREATE INDEX idx_scan_events_created_at ON scan_events (created_at DESC);
CREATE INDEX idx_scan_events_event_type ON scan_events (event_type);

-- ============================================================================
-- Add columns to existing tables for v2.2.5 features
-- ============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS okta_config jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS aws_config jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pro_scan_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE scans ADD COLUMN IF NOT EXISTS semantic_findings_count integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS audit_clauses_count integer DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS graph_snapshot_id uuid;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS perf_metrics jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS scan_tier text DEFAULT 'standard';

ALTER TABLE findings ADD COLUMN IF NOT EXISTS semantic_finding_id uuid;
ALTER TABLE findings ADD COLUMN IF NOT EXISTS audit_clause_count integer DEFAULT 0;

ALTER TABLE repositories ADD COLUMN IF NOT EXISTS cyclomatic_complexity integer DEFAULT 0;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS semantic_risk_score numeric(5,2) DEFAULT 0.00;

-- ============================================================================
-- RLS ENABLE
-- ============================================================================
ALTER TABLE semantic_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;

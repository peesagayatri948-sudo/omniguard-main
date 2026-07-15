-- ============================================================================
-- OmniGuard Full Rebuild — Migration 004: Graph, Workers, AI, Rate Limiting
-- ============================================================================

-- ============================================================================
-- TABLE: graph_nodes
-- ============================================================================
CREATE TABLE graph_nodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  repository_name text NOT NULL,
  node_id         text NOT NULL,
  node_type       text NOT NULL,
  node_data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  imports         jsonb NOT NULL DEFAULT '[]'::jsonb,
  depth           integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_graph_nodes_org_id ON graph_nodes (organization_id);
CREATE INDEX idx_graph_nodes_repo_name ON graph_nodes (repository_name);
CREATE INDEX idx_graph_nodes_node_id ON graph_nodes (node_id);
CREATE INDEX idx_graph_nodes_depth ON graph_nodes (depth);

-- ============================================================================
-- TABLE: worker_heartbeats
-- ============================================================================
CREATE TABLE worker_heartbeats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       text NOT NULL,
  worker_type     text NOT NULL DEFAULT 'scan',
  status          text NOT NULL DEFAULT 'idle',
  current_scan_id uuid REFERENCES scans(id) ON DELETE SET NULL,
  last_heartbeat  timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_heartbeats_worker_id ON worker_heartbeats (worker_id);
CREATE INDEX idx_worker_heartbeats_status ON worker_heartbeats (status);

-- ============================================================================
-- TABLE: ai_cache
-- ============================================================================
CREATE TABLE ai_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key       text NOT NULL UNIQUE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  model           text NOT NULL,
  prompt_hash     text NOT NULL,
  response_text   text NOT NULL,
  tokens_used     integer DEFAULT 0,
  expires_at      timestamptz NOT NULL,
  hit_count       integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_cache_org_id ON ai_cache (organization_id);
CREATE INDEX idx_ai_cache_cache_key ON ai_cache (cache_key);
CREATE INDEX idx_ai_cache_expires_at ON ai_cache (expires_at);

-- ============================================================================
-- TABLE: ai_usage
-- ============================================================================
CREATE TABLE ai_usage (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_id         uuid REFERENCES scans(id) ON DELETE SET NULL,
  provider        text NOT NULL,
  model           text NOT NULL,
  tier            text NOT NULL DEFAULT 'medium',
  prompt_tokens   integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens    integer DEFAULT 0,
  cache_hit       boolean DEFAULT false,
  latency_ms      integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_org_id ON ai_usage (organization_id);
CREATE INDEX idx_ai_usage_scan_id ON ai_usage (scan_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage (created_at DESC);

-- ============================================================================
-- TABLE: organization_suppression_rules
-- ============================================================================
CREATE TABLE organization_suppression_rules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scanner                 text NOT NULL,
  rule_id                 text,
  file_pattern            text,
  false_positive_likelihood numeric(3,2) DEFAULT 0.90,
  dismiss_count           integer DEFAULT 0,
  active                  boolean NOT NULL DEFAULT true,
  generated_from_finding_id uuid REFERENCES findings(id) ON DELETE SET NULL,
  last_dismissed_at       timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppression_rules_org_id ON organization_suppression_rules (organization_id);
CREATE INDEX idx_suppression_rules_scanner_rule ON organization_suppression_rules (scanner, rule_id);
CREATE INDEX idx_suppression_rules_active ON organization_suppression_rules (active);

-- ============================================================================
-- TABLE: scan_artifacts
-- ============================================================================
CREATE TABLE scan_artifacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  artifact_type   text NOT NULL,
  filename        text NOT NULL,
  storage_path    text,
  size_bytes      bigint DEFAULT 0,
  mime_type       text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_artifacts_scan_id ON scan_artifacts (scan_id);
CREATE INDEX idx_scan_artifacts_org_id ON scan_artifacts (organization_id);

-- ============================================================================
-- TABLE: project_risk_history
-- ============================================================================
CREATE TABLE project_risk_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  repository_id   uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  scan_id         uuid REFERENCES scans(id) ON DELETE SET NULL,
  score           integer NOT NULL DEFAULT 0,
  factors         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_history_org_id ON project_risk_history (organization_id);
CREATE INDEX idx_risk_history_repo_id ON project_risk_history (repository_id);

-- ============================================================================
-- TABLE: api_key_usage
-- ============================================================================
CREATE TABLE api_key_usage (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id          uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint        text,
  method          text,
  status_code     integer,
  response_ms     integer,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_key_usage_key_id ON api_key_usage (key_id);
CREATE INDEX idx_api_key_usage_org_id ON api_key_usage (organization_id);
CREATE INDEX idx_api_key_usage_created_at ON api_key_usage (created_at DESC);

-- ============================================================================
-- TABLE: rate_limit_counters
-- ============================================================================
CREATE TABLE rate_limit_counters (
  key           text PRIMARY KEY,
  window_start  timestamptz NOT NULL DEFAULT now(),
  count         integer NOT NULL DEFAULT 0
);

-- ============================================================================
-- TABLE: organization_integrations
-- ============================================================================
CREATE TABLE organization_integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  credentials     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

CREATE INDEX idx_org_integrations_org_id ON organization_integrations (organization_id);
CREATE INDEX idx_org_integrations_provider ON organization_integrations (provider);

-- ============================================================================
-- RLS ENABLE
-- ============================================================================
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_suppression_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;

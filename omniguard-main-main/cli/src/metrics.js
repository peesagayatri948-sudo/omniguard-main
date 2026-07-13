// Phase 16: Prometheus and OpenTelemetry Tracing Metrics stub
class MetricsTracker {
  constructor() {
    this.metrics = {
      scan_duration_seconds: {},
      findings_total: { critical: 0, high: 0, medium: 0, low: 0 },
      queue_jobs_processed: 0,
      active_connections: 0
    };
  }

  recordScanDuration(filePath, durationMs) {
    this.metrics.scan_duration_seconds[filePath] = durationMs / 1000;
  }

  recordFinding(severity) {
    const sev = severity.toLowerCase();
    if (this.metrics.findings_total[sev] !== undefined) {
      this.metrics.findings_total[sev]++;
    }
  }

  recordJobProcessed() {
    this.metrics.queue_jobs_processed++;
  }

  getPrometheusFormat() {
    // Basic Prometheus exposition format string
    return `# HELP omniguard_findings_total Total findings by severity
# TYPE omniguard_findings_total counter
omniguard_findings_total{severity="critical"} ${this.metrics.findings_total.critical}
omniguard_findings_total{severity="high"} ${this.metrics.findings_total.high}
omniguard_findings_total{severity="medium"} ${this.metrics.findings_total.medium}
omniguard_findings_total{severity="low"} ${this.metrics.findings_total.low}

# HELP omniguard_jobs_processed_total Total background queue jobs processed
# TYPE omniguard_jobs_processed_total counter
omniguard_jobs_processed_total ${this.metrics.queue_jobs_processed}
`;
  }
}

module.exports = new MetricsTracker();

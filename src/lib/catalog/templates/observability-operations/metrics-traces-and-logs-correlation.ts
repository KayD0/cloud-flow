import type { DesignTemplate } from "../../model";

const template = {
  slug: "metrics-traces-and-logs-correlation",
  name: "Metrics, Traces and Logs Correlation",
  summary: "Metricsの異常からTraceと関連Logsを相関する流れを示します。",
  primaryCategory: "observability-operations",
  tags: ["Metrics, Traces and Logs Correlation", "observability-operations"],
  concepts: ["Metrics, Traces and Logs Correlation"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/observability-operations/metrics-traces-and-logs-correlation",
} as const satisfies DesignTemplate;

export default template;

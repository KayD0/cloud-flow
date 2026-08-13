import type { DesignTemplate } from "../../model";

const template = {
  slug: "metrics-pipeline",
  name: "Metrics Pipeline",
  summary: "Metricsの生成、収集、集約、Dashboardへの反映をたどります。",
  primaryCategory: "observability-operations",
  tags: ["Metrics Pipeline", "observability-operations"],
  concepts: ["Metrics Pipeline"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/observability-operations/metrics-pipeline",
} as const satisfies DesignTemplate;

export default template;

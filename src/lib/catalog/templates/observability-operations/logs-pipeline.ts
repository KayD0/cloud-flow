import type { DesignTemplate } from "../../model";

const template = {
  slug: "logs-pipeline",
  name: "Logs Pipeline",
  summary: "Logsの収集、構造化、属性付与、集約を示します。",
  primaryCategory: "observability-operations",
  tags: ["Logs Pipeline", "observability-operations"],
  concepts: ["Logs Pipeline"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/observability-operations/logs-pipeline",
} as const satisfies DesignTemplate;

export default template;

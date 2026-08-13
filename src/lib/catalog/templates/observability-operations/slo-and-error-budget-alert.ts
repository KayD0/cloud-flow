import type { DesignTemplate } from "../../model";

const template = {
  slug: "slo-and-error-budget-alert",
  name: "SLO and Error Budget Alert",
  summary: "SLI計測、SLO評価、Error Budget消費、Alert発火をたどります。",
  primaryCategory: "observability-operations",
  tags: ["SLO and Error Budget Alert", "observability-operations"],
  concepts: ["SLO and Error Budget Alert"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/observability-operations/slo-and-error-budget-alert",
} as const satisfies DesignTemplate;

export default template;

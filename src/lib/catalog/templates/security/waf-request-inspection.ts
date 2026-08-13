import type { DesignTemplate } from "../../model";

const template = {
  slug: "waf-request-inspection",
  name: "WAF Request Inspection",
  summary: "WAFによる要求の検査、通過、Blockを観察します。",
  primaryCategory: "security",
  tags: ["WAF Request Inspection", "security"],
  concepts: ["WAF Request Inspection"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/security/waf-request-inspection",
} as const satisfies DesignTemplate;

export default template;

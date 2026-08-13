import type { DesignTemplate } from "../../model";

const template = {
  slug: "security-group-rule-evaluation",
  name: "Security Group Rule Evaluation",
  summary: "IngressとEgress Ruleによる通信の許可・拒否を示します。",
  primaryCategory: "security",
  tags: ["Security Group Rule Evaluation", "security"],
  concepts: ["Security Group Rule Evaluation"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/security/security-group-rule-evaluation",
} as const satisfies DesignTemplate;

export default template;

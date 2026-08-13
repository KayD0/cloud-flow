import type { DesignTemplate } from "../../model";

const template = {
  slug: "authentication-and-authorization",
  name: "Authentication and Authorization",
  summary: "Identity Providerによる認証とPolicyによる認可を比較します。",
  primaryCategory: "security",
  tags: ["Authentication and Authorization", "security"],
  concepts: ["Authentication and Authorization"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/security/authentication-and-authorization",
} as const satisfies DesignTemplate;

export default template;

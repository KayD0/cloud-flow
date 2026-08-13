import type { DesignTemplate } from "../../model";

const template = {
  slug: "firewall-allow-deny",
  name: "Firewall Allow / Deny",
  summary: "Firewall Ruleの評価と許可・拒否の位置・理由を示します。",
  primaryCategory: "security",
  tags: ["Firewall Allow / Deny", "security"],
  concepts: ["Firewall Allow / Deny"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/security/firewall-allow-deny",
} as const satisfies DesignTemplate;

export default template;

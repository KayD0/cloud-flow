import type { DesignTemplate } from "../../model";

const template = {
  slug: "health-check-isolation-and-rejoin",
  name: "Health Check Isolation and Rejoin",
  summary: "Health Check失敗による切り離しと回復後の再参加を示します。",
  primaryCategory: "reliability-recovery",
  tags: ["Health Check Isolation and Rejoin", "reliability-recovery"],
  concepts: ["Health Check Isolation and Rejoin"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/reliability-recovery/health-check-isolation-and-rejoin",
} as const satisfies DesignTemplate;

export default template;

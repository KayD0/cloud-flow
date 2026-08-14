import type { DesignTemplate } from "../../model";

const template = {
  slug: "health-check-isolation-and-rejoin",
  name: "Health Check Isolation and Rejoin",
  summary: "連続 Health Check 失敗による Node の切り離しと、回復確認後の段階的な再参加を示します。",
  primaryCategory: "reliability-recovery",
  tags: ["Health Check", "Isolation", "Recovery"],
  concepts: ["Failure threshold", "Traffic isolation", "Progressive rejoin"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Healthy → Warning → Down → Isolated → Recovered → Healthy"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/reliability-recovery/health-check-isolation-and-rejoin",
} as const satisfies DesignTemplate;

export default template;

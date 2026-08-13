import type { DesignTemplate } from "../../model";

const template = {
  slug: "database-replica-promotion",
  name: "Database Replica Promotion",
  summary: "Primary障害後のReplica昇格と書き込み先切り替えを示します。",
  primaryCategory: "reliability-recovery",
  tags: ["Database Replica Promotion", "reliability-recovery"],
  concepts: ["Database Replica Promotion"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/reliability-recovery/database-replica-promotion",
} as const satisfies DesignTemplate;

export default template;

import type { DesignTemplate } from "../../model";

const template = {
  slug: "database-replica-promotion",
  name: "Database Replica Promotion",
  summary: "Primary 障害後に Replica を昇格し、書き込み接続を切り替えて提供を再開する復旧判断を学びます。",
  primaryCategory: "reliability-recovery",
  tags: ["Failover", "Database", "Reliability & Recovery"],
  concepts: ["Replica promotion", "Connection switch", "Recovery sequencing"],
  difficulty: "Intermediate",
  status: "available",
  motions: ["Primary Down → Replica Promoting → Connection switch → Recovered"],
  actions: ["Play", "Pause", "Reset", "Inject failure", "Adjust traffic"],
  href: "/templates/reliability-recovery/database-replica-promotion",
} as const satisfies DesignTemplate;

export default template;

import type { DesignTemplate } from "../../model";

const template = {
  slug: "active-standby-multi-az-failover",
  name: "Active / Standby Multi-AZ Failover",
  summary: "Active障害からStandbyへの切り替えと復旧確認を示します。",
  primaryCategory: "reliability-recovery",
  tags: ["Active / Standby Multi-AZ Failover", "reliability-recovery"],
  concepts: ["Active / Standby Multi-AZ Failover"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/reliability-recovery/active-standby-multi-az-failover",
} as const satisfies DesignTemplate;

export default template;

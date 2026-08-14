import type { DesignTemplate } from "../../model";

const template = {
  slug: "active-standby-multi-az-failover",
  name: "Active / Standby Multi-AZ Failover",
  summary: "Active 障害の検知から別 AZ の Standby 昇格、復旧確認までの判断と状態遷移を追跡します。",
  primaryCategory: "reliability-recovery",
  tags: ["Multi-AZ", "Failover", "Recovery"],
  concepts: ["Active / Standby", "Failure detection", "Standby promotion", "Recovery confirmation"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Health state transition", "Standby promotion", "Traffic path switch"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/reliability-recovery/active-standby-multi-az-failover",
} as const satisfies DesignTemplate;

export default template;

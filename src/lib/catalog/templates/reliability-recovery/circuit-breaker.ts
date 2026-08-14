import type { DesignTemplate } from "../../model";

const template = {
  slug: "circuit-breaker",
  name: "Circuit Breaker",
  summary: "失敗率の閾値と回復試行を操作し、Closed、Open、Half-open の判断と依存先の保護を追跡します。",
  primaryCategory: "reliability-recovery",
  tags: ["Circuit Breaker", "Failure isolation", "Synthetic data"],
  concepts: ["Circuit Breaker", "Failure threshold", "Recovery probe"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Closed → Open → Half-open → Closed / Open"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/reliability-recovery/circuit-breaker",
} as const satisfies DesignTemplate;

export default template;

import type { DesignTemplate } from "../../model";

const template = {
  slug: "circuit-breaker",
  name: "Circuit Breaker",
  summary: "Closed、Open、Half-openの状態遷移を観察します。",
  primaryCategory: "reliability-recovery",
  tags: ["Circuit Breaker", "reliability-recovery"],
  concepts: ["Circuit Breaker"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/reliability-recovery/circuit-breaker",
} as const satisfies DesignTemplate;

export default template;

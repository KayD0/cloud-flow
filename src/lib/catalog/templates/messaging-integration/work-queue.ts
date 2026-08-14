import type { DesignTemplate } from "../../model";

const template = {
  slug: "work-queue",
  name: "Work Queue",
  summary: "Producerと競合Consumerの間でMessageが蓄積・配送・処理される動きを示します。",
  primaryCategory: "messaging-integration",
  tags: ["Work Queue", "messaging-integration"],
  concepts: ["Work Queue"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Message flow", "Queue backlog", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/work-queue",
} as const satisfies DesignTemplate;

export default template;

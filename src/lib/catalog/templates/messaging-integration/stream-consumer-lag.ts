import type { DesignTemplate } from "../../model";

const template = {
  slug: "stream-consumer-lag",
  name: "Stream Consumer Lag",
  summary: "Consumerごとの読み取り位置とLagの増減を示します。",
  primaryCategory: "messaging-integration",
  tags: ["Stream Consumer Lag", "messaging-integration"],
  concepts: ["Stream Consumer Lag"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/stream-consumer-lag",
} as const satisfies DesignTemplate;

export default template;

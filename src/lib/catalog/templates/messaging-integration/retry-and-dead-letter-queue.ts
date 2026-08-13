import type { DesignTemplate } from "../../model";

const template = {
  slug: "retry-and-dead-letter-queue",
  name: "Retry and Dead Letter Queue",
  summary: "配送失敗後の待機、Retry、Dead Letter Queueへの移動をたどります。",
  primaryCategory: "messaging-integration",
  tags: ["Retry and Dead Letter Queue", "messaging-integration"],
  concepts: ["Retry and Dead Letter Queue"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/retry-and-dead-letter-queue",
} as const satisfies DesignTemplate;

export default template;

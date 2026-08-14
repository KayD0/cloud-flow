import type { DesignTemplate } from "../../model";

const template = {
  slug: "retry-and-dead-letter-queue",
  name: "Retry and Dead Letter Queue",
  summary: "配送失敗後の待機、上限付きRetry、Dead Letter Queueへの移動をたどります。",
  primaryCategory: "messaging-integration",
  tags: ["Retry and Dead Letter Queue", "messaging-integration"],
  concepts: ["Bounded Retry", "Retry Wait", "Dead Letter Queue"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Queue delivery", "Retry wait", "Dead-letter routing"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/messaging-integration/retry-and-dead-letter-queue",
} as const satisfies DesignTemplate;

export default template;

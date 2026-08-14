import type { DesignTemplate } from "../../model";

const template = {
  slug: "stream-consumer-lag",
  name: "Stream Consumer Lag",
  summary: "Stream への追記と Consumer ごとの読み取り位置をたどり、発行量と処理量の差が Lag をどう変えるか観察します。",
  primaryCategory: "messaging-integration",
  tags: ["Stream", "Consumer Lag", "Messaging & Integration"],
  concepts: ["Append-only stream", "Consumer cursor", "Consumer lag", "Backpressure"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Data flow", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/stream-consumer-lag",
} as const satisfies DesignTemplate;

export default template;

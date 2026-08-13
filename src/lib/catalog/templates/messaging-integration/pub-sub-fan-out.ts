import type { DesignTemplate } from "../../model";

const template = {
  slug: "pub-sub-fan-out",
  name: "Pub/Sub Fan-out",
  summary: "1回のPublishが複数Subscriberへ分岐する様子を示します。",
  primaryCategory: "messaging-integration",
  tags: ["Pub/Sub Fan-out", "messaging-integration"],
  concepts: ["Pub/Sub Fan-out"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/pub-sub-fan-out",
} as const satisfies DesignTemplate;

export default template;

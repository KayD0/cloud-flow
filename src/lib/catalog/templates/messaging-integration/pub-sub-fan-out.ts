import type { DesignTemplate } from "../../model";

const template = {
  slug: "pub-sub-fan-out",
  name: "Pub/Sub Fan-out",
  summary: "Publisher の1回の Publish が Topic を介して複数の Subscriber へ分岐・配送される様子を追跡します。",
  primaryCategory: "messaging-integration",
  tags: ["Pub/Sub Fan-out", "Messaging & Integration", "Vendor neutral"],
  concepts: ["Publish / Subscribe", "Topic", "Fan-out delivery"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Publish transit", "Fan-out delivery", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/pub-sub-fan-out",
} as const satisfies DesignTemplate;

export default template;

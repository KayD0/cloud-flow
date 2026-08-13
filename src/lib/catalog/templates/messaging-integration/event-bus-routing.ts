import type { DesignTemplate } from "../../model";

const template = {
  slug: "event-bus-routing",
  name: "Event Bus Routing",
  summary: "イベント属性とRuleによる非同期の配送先変更を観察します。",
  primaryCategory: "messaging-integration",
  tags: ["Event Bus Routing", "messaging-integration"],
  concepts: ["Event Bus Routing"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/event-bus-routing",
} as const satisfies DesignTemplate;

export default template;

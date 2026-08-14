import type { DesignTemplate } from "../../model";

const template = {
  slug: "event-bus-routing",
  name: "Event Bus Routing",
  summary: "イベント属性をRuleで評価し、非同期イベントの配送先が変わる様子を観察します。",
  primaryCategory: "messaging-integration",
  tags: ["Event Bus", "Rule evaluation", "messaging-integration"],
  concepts: ["Event Bus Routing", "Content-based routing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Producer → Event Bus → Rule evaluation → Consumer"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/messaging-integration/event-bus-routing",
} as const satisfies DesignTemplate;

export default template;

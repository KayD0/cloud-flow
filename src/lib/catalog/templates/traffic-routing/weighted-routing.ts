import type { DesignTemplate } from "../../model";

const template = {
  slug: "weighted-routing",
  name: "カナリア・コントロール",
  summary: "Stable と Canary の重みを判断し、目標配分と安全条件を同時に満たす Weighted Routing ミニゲームです。",
  primaryCategory: "traffic-routing",
  tags: ["Weighted Routing", "Canary release", "traffic-routing"],
  concepts: ["Weighted Routing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition", "Score feedback"],
  actions: ["Play", "Pause", "Reset", "Adjust traffic"],
  href: "/templates/traffic-routing/weighted-routing",
} as const satisfies DesignTemplate;

export default template;

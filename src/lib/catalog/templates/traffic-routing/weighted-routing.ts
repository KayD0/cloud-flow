import type { DesignTemplate } from "../../model";

const template = {
  slug: "weighted-routing",
  name: "Weighted Routing",
  summary: "重みに基づく配送比率と段階的リリースの経路変化を観察します。",
  primaryCategory: "traffic-routing",
  tags: ["Weighted Routing", "traffic-routing"],
  concepts: ["Weighted Routing"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/weighted-routing",
} as const satisfies DesignTemplate;

export default template;

import type { DesignTemplate } from "../../model";

const template = {
  slug: "host-path-based-routing",
  name: "ルート・ソーター",
  summary: "Gatewayルール設計者としてHostとPathを読み、Requestを正しいServiceへ仕分ける学習ミニゲームです。",
  primaryCategory: "traffic-routing",
  tags: ["Host / Path-based Routing", "traffic-routing"],
  concepts: ["Host / Path-based Routing", "Specific rule matching", "Default Route safety"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Round feedback", "Result transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/host-path-based-routing",
} as const satisfies DesignTemplate;

export default template;

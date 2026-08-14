import type { DesignTemplate } from "../../model";

const template = {
  slug: "round-robin-load-balancing",
  name: "Round Robin Load Balancing",
  summary: "複数の正常な Backend へリクエストを順番に振り分け、停止した配送先が除外される動きを観察します。",
  primaryCategory: "traffic-routing",
  tags: ["Round Robin", "Load Balancing", "Traffic & Routing"],
  concepts: ["Round Robin Load Balancing", "Health-aware routing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "State transition"],
  actions: ["Play", "Pause", "Reset", "Adjust traffic", "Inject failure"],
  href: "/templates/traffic-routing/round-robin-load-balancing",
} as const satisfies DesignTemplate;

export default template;

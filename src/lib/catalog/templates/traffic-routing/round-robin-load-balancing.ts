import type { DesignTemplate } from "../../model";

const template = {
  slug: "round-robin-load-balancing",
  name: "Round Robin Load Balancing",
  summary: "正常なサーバーへリクエストを順番に振り分け、障害時の経路変化を観察します。",
  primaryCategory: "traffic-routing",
  tags: ["Round Robin Load Balancing", "traffic-routing"],
  concepts: ["Round Robin Load Balancing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset", "Adjust traffic", "Inject failure"],
  href: "/templates/traffic-routing/round-robin-load-balancing",
} as const satisfies DesignTemplate;

export default template;

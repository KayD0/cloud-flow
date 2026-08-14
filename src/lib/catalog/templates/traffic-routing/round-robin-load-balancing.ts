import type { DesignTemplate } from "../../model";

const template = {
  slug: "round-robin-load-balancing",
  name: "ラウンドロビン・ディーラー",
  summary: "Load Balancer 係として、到着した Request を次の Healthy な Server へ公平に配る学習ミニゲームです。",
  primaryCategory: "traffic-routing",
  tags: ["Round Robin", "Load Balancing", "Traffic & Routing"],
  concepts: ["Round Robin Load Balancing", "Health-aware routing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "Round result", "Immediate feedback"],
  actions: ["Start", "Pause", "Reset", "Deal request", "Adjust traffic", "Inject failure"],
  href: "/templates/traffic-routing/round-robin-load-balancing",
} as const satisfies DesignTemplate;

export default template;

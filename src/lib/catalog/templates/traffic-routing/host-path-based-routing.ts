import type { DesignTemplate } from "../../model";

const template = {
  slug: "host-path-based-routing",
  name: "Host / Path-based Routing",
  summary: "HostとPath、ルール優先順位を評価してWeb・API・Admin Backendへ配送する流れを追います。",
  primaryCategory: "traffic-routing",
  tags: ["Host / Path-based Routing", "traffic-routing"],
  concepts: ["Host / Path-based Routing", "Rule priority", "Fallback routing"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/host-path-based-routing",
} as const satisfies DesignTemplate;

export default template;

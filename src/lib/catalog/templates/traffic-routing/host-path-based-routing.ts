import type { DesignTemplate } from "../../model";

const template = {
  slug: "host-path-based-routing",
  name: "Host / Path-based Routing",
  summary: "HostとPathのルール評価によって配送先が変わる様子を追います。",
  primaryCategory: "traffic-routing",
  tags: ["Host / Path-based Routing", "traffic-routing"],
  concepts: ["Host / Path-based Routing"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/host-path-based-routing",
} as const satisfies DesignTemplate;

export default template;

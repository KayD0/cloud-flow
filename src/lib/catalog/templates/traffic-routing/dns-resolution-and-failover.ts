import type { DesignTemplate } from "../../model";

const template = {
  slug: "dns-resolution-and-failover",
  name: "DNS Resolution and Failover",
  summary: "名前解決、TTL、代替Endpointへの切り替えを観察します。",
  primaryCategory: "traffic-routing",
  tags: ["DNS Resolution and Failover", "traffic-routing"],
  concepts: ["DNS Resolution and Failover"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/dns-resolution-and-failover",
} as const satisfies DesignTemplate;

export default template;

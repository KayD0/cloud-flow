import type { DesignTemplate } from "../../model";

const template = {
  slug: "internet-gateway-and-nat-gateway",
  name: "Internet Gateway and NAT Gateway",
  summary: "Gateway 管制官として Ingress と Egress を見分け、Public ingress と Private egress を安全に成立させるミニゲームです。",
  primaryCategory: "network-connectivity",
  tags: ["Gateway", "Ingress / Egress", "Public / Private"],
  concepts: ["Internet Gateway", "NAT Gateway", "Public / Private Resource"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Round feedback", "Gateway state transition"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/network-connectivity/internet-gateway-and-nat-gateway",
} as const satisfies DesignTemplate;

export default template;

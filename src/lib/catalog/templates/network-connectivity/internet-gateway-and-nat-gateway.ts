import type { DesignTemplate } from "../../model";

const template = {
  slug: "internet-gateway-and-nat-gateway",
  name: "Internet Gateway and NAT Gateway",
  summary: "Ingress と Egress を切り替え、Public / Private Resource の外部接続経路の違いを確認します。",
  primaryCategory: "network-connectivity",
  tags: ["Gateway", "Ingress / Egress", "Public / Private"],
  concepts: ["Internet Gateway", "NAT Gateway", "Public / Private Resource"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Directional packet flow", "Gateway state transition"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/network-connectivity/internet-gateway-and-nat-gateway",
} as const satisfies DesignTemplate;

export default template;

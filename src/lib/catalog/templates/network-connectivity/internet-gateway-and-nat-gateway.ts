import type { DesignTemplate } from "../../model";

const template = {
  slug: "internet-gateway-and-nat-gateway",
  name: "Internet Gateway and NAT Gateway",
  summary: "IngressとEgress、PublicとPrivate Resourceの外部接続経路を比較します。",
  primaryCategory: "network-connectivity",
  tags: ["Internet Gateway and NAT Gateway", "network-connectivity"],
  concepts: ["Internet Gateway and NAT Gateway"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/internet-gateway-and-nat-gateway",
} as const satisfies DesignTemplate;

export default template;

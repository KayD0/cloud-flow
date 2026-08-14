import type { DesignTemplate } from "../../model";

const template = {
  slug: "internet-gateway-and-nat-gateway",
  name: "Internet Gateway and NAT Gateway",
  summary: "Public ingress と Private egress の方向差を、二つの Gateway と自動通信フローで可視化します。",
  primaryCategory: "network-connectivity",
  tags: ["Gateway", "Ingress / Egress", "Public / Private"],
  concepts: ["Internet Gateway", "NAT Gateway", "Public / Private Resource"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Automatic ingress flow", "Automatic egress flow", "Loop reset"],
  actions: [],
  href: "/templates/network-connectivity/internet-gateway-and-nat-gateway",
} as const satisfies DesignTemplate;

export default template;

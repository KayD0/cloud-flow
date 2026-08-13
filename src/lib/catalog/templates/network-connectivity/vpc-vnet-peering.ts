import type { DesignTemplate } from "../../model";

const template = {
  slug: "vpc-vnet-peering",
  name: "VPC / VNet Peering",
  summary: "Peeringの確立前後でネットワーク間の到達可能性が変わる様子を示します。",
  primaryCategory: "network-connectivity",
  tags: ["VPC / VNet Peering", "Reachability", "Network & Connectivity"],
  concepts: ["VPC / VNet Peering", "Bidirectional connectivity", "Network isolation"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition", "Bidirectional flow"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/vpc-vnet-peering",
} as const satisfies DesignTemplate;

export default template;

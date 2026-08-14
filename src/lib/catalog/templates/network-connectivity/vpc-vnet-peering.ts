import type { DesignTemplate } from "../../model";

const template = {
  slug: "vpc-vnet-peering",
  name: "ピアリング・ブリッジ",
  summary: "重複しない VPC / VNet を選び、Peering と双方向 Route を構成して到達性を完成させる学習ミニゲームです。",
  primaryCategory: "network-connectivity",
  tags: ["VPC / VNet Peering", "Bidirectional Route", "Network & Connectivity"],
  concepts: ["VPC / VNet Peering", "CIDR overlap", "Bidirectional connectivity"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition", "Bidirectional flow", "Result feedback"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/vpc-vnet-peering",
} as const satisfies DesignTemplate;

export default template;

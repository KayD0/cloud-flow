import type { DesignTemplate } from "../../model";

const template = {
  slug: "public-private-subnet-connectivity",
  name: "Public / Private Subnet Connectivity",
  summary: "Public / Private Subnet の境界と、Internet / Internal Client から Resource への到達可能範囲を比較します。",
  primaryCategory: "network-connectivity",
  tags: ["Public Subnet", "Private Subnet", "Gateway", "network-connectivity"],
  concepts: ["Subnet boundary", "External and internal reachability", "Gateway dependency"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Packet flow", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/public-private-subnet-connectivity",
} as const satisfies DesignTemplate;

export default template;

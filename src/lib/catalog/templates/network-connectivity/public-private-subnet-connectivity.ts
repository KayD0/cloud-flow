import type { DesignTemplate } from "../../model";

const template = {
  slug: "public-private-subnet-connectivity",
  name: "Public / Private Subnet Connectivity",
  summary: "Public / Private Subnetの境界と外部・内部からの到達範囲を比較します。",
  primaryCategory: "network-connectivity",
  tags: ["Public / Private Subnet Connectivity", "network-connectivity"],
  concepts: ["Public / Private Subnet Connectivity"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/public-private-subnet-connectivity",
} as const satisfies DesignTemplate;

export default template;

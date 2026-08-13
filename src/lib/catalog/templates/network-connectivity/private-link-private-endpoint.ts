import type { DesignTemplate } from "../../model";

const template = {
  slug: "private-link-private-endpoint",
  name: "Private Link / Private Endpoint",
  summary: "Private Subnet から Private Endpoint を経由して Managed Service へ到達する、非公開経路と Public 経路の違いを学びます。",
  primaryCategory: "network-connectivity",
  tags: ["Private Endpoint", "Private Path", "Network & Connectivity"],
  concepts: ["Private Link", "Private Endpoint", "Public route comparison"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/private-link-private-endpoint",
} as const satisfies DesignTemplate;

export default template;

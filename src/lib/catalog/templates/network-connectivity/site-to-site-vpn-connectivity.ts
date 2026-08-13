import type { DesignTemplate } from "../../model";

const template = {
  slug: "site-to-site-vpn-connectivity",
  name: "Site-to-Site VPN Connectivity",
  summary: "オンプレミスとクラウド間でVPN Tunnelが確立・切断される動きを示します。",
  primaryCategory: "network-connectivity",
  tags: ["Site-to-Site VPN Connectivity", "network-connectivity"],
  concepts: ["Site-to-Site VPN Connectivity"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/site-to-site-vpn-connectivity",
} as const satisfies DesignTemplate;

export default template;

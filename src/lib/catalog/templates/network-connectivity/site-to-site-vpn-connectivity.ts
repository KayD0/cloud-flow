import type { DesignTemplate } from "../../model";

const template = {
  slug: "site-to-site-vpn-connectivity",
  name: "Site-to-Site VPN Connectivity",
  summary: "オンプレミスとクラウド間でVPN Tunnelが確立・切断される動きを示します。",
  primaryCategory: "network-connectivity",
  tags: ["VPN Tunnel", "Hybrid Network", "Network Connectivity"],
  concepts: ["Tunnel lifecycle", "Bidirectional routing", "Gateway boundary"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Tunnel state transition", "Bidirectional packet flow"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/site-to-site-vpn-connectivity",
} as const satisfies DesignTemplate;

export default template;

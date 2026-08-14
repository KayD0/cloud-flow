import type { DesignTemplate } from "../../model";

const template = {
  slug: "site-to-site-vpn-connectivity",
  name: "Site-to-Site VPN Connectivity",
  summary: "VPNトンネル・キーパーとして鍵と経路を判断し、切断されたTunnelを復旧します。",
  primaryCategory: "network-connectivity",
  tags: ["VPN Tunnel", "Hybrid Network", "Network Connectivity"],
  concepts: ["Tunnel recovery", "Pre-shared key matching", "Route matching"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Tunnel state transition", "Incident and recovery feedback"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/network-connectivity/site-to-site-vpn-connectivity",
} as const satisfies DesignTemplate;

export default template;

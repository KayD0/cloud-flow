import type { DesignTemplate } from "../../model";

const template = {
  slug: "dns-resolution-and-failover",
  name: "DNS Resolution and Failover",
  summary: "DNS キャッシュの TTL とレコード変更が、障害時の接続先切り替えに与える影響を観察します。",
  primaryCategory: "traffic-routing",
  tags: ["DNS", "TTL", "Failover"],
  concepts: ["DNS resolution", "Resolver cache", "TTL", "Endpoint failover"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Client query", "Cached response", "Endpoint request", "State transition"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/traffic-routing/dns-resolution-and-failover",
} as const satisfies DesignTemplate;

export default template;

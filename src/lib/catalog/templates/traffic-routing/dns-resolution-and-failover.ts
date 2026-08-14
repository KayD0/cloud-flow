import type { DesignTemplate } from "../../model";

const template = {
  slug: "dns-resolution-and-failover",
  name: "DNSレスキュー",
  summary: "TTLキャッシュとDNS Failoverの因果を判断し、Clientの通信を到達可能なEndpointへ復旧する学習ミニゲームです。",
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

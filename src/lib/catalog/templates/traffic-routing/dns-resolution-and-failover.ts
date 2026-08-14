import type { DesignTemplate } from "../../model";

const template = {
  slug: "dns-resolution-and-failover",
  name: "DNSレスキュー",
  summary: "名前解決から正常 Endpoint への接続、障害検知後に代替 Endpoint へ切り替わる流れを自動再生します。",
  primaryCategory: "traffic-routing",
  tags: ["DNS", "TTL", "Failover"],
  concepts: ["DNS resolution", "Resolver cache", "Health check", "Endpoint failover"],
  difficulty: "Beginner",
  status: "available",
  motions: ["DNS query", "Endpoint request", "Failure detection", "Route transition"],
  actions: [],
  href: "/templates/traffic-routing/dns-resolution-and-failover",
} as const satisfies DesignTemplate;

export default template;

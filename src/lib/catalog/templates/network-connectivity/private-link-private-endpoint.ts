import type { DesignTemplate } from "../../model";

const template = {
  slug: "private-link-private-endpoint",
  name: "プライベート・パス",
  summary: "Private Endpoint を配置して経路を選び、Public Internet を避けて全 Request を届ける学習ミニゲームです。",
  primaryCategory: "network-connectivity",
  tags: ["Private Endpoint", "Private Path", "Network & Connectivity"],
  concepts: ["Private Link", "Private Endpoint", "Private / Public route decision"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "Round result", "Score feedback"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/private-link-private-endpoint",
} as const satisfies DesignTemplate;

export default template;

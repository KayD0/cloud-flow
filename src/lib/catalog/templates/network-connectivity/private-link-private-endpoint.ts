import type { DesignTemplate } from "../../model";

const template = {
  slug: "private-link-private-endpoint",
  name: "プライベート・パス",
  summary: "Client の通信が Public Internet へ出ず、Private Endpoint と Private Link を経由して Service に到達する自動再生 UI サンプルです。",
  primaryCategory: "network-connectivity",
  tags: ["Private Endpoint", "Private Link", "Private Path"],
  concepts: ["Private Link", "Private Endpoint", "Private / Public route separation"],
  difficulty: "Beginner",
  status: "available",
  motions: ["DNS resolution", "Private request flow", "Loop reset"],
  actions: [],
  href: "/templates/network-connectivity/private-link-private-endpoint",
} as const satisfies DesignTemplate;

export default template;

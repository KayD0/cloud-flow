import type { DesignTemplate } from "../../model";

const template = {
  slug: "private-link-private-endpoint",
  name: "Private Link / Private Endpoint",
  summary: "Public Internetを経由しないPrivate Endpointの接続経路をたどります。",
  primaryCategory: "network-connectivity",
  tags: ["Private Link / Private Endpoint", "network-connectivity"],
  concepts: ["Private Link / Private Endpoint"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/network-connectivity/private-link-private-endpoint",
} as const satisfies DesignTemplate;

export default template;

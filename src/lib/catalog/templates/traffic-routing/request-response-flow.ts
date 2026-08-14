import type { DesignTemplate } from "../../model";

const template = {
  slug: "request-response-flow",
  name: "リクエスト・リレー",
  summary: "通信オペレーターとして経路を判断し、Request を正しい Server へ、Response を要求元の Client へ届ける学習ミニゲームです。",
  primaryCategory: "traffic-routing",
  tags: ["Request / Response Flow", "Traffic & Routing", "Vendor neutral"],
  concepts: ["Request / Response Flow", "Server routing", "Round trip"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request transit", "Server processing", "Response transit", "Result feedback"],
  actions: ["Select route", "Send", "Pause", "Reset"],
  href: "/templates/traffic-routing/request-response-flow",
} as const satisfies DesignTemplate;

export default template;

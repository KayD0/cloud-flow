import type { DesignTemplate } from "../../model";

const template = {
  slug: "request-response-flow",
  name: "Request / Response Flow",
  summary: "RequestがBackendへ届き、ResponseがClientへ戻る基本的な往復通信をたどります。",
  primaryCategory: "traffic-routing",
  tags: ["Request / Response Flow", "traffic-routing"],
  concepts: ["Request / Response Flow"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/request-response-flow",
} as const satisfies DesignTemplate;

export default template;

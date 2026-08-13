import type { DesignTemplate } from "../../model";

const template = {
  slug: "request-response-flow",
  name: "Request / Response Flow",
  summary: "Client から Backend へ届く Request と、Client へ戻る Response の往復を段階的に追跡します。",
  primaryCategory: "traffic-routing",
  tags: ["Request / Response Flow", "Traffic & Routing", "Vendor neutral"],
  concepts: ["Request / Response Flow", "Gateway routing", "Round trip"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request transit", "Backend processing", "Response transit", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/traffic-routing/request-response-flow",
} as const satisfies DesignTemplate;

export default template;

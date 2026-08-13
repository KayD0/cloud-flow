import type { DesignTemplate } from "../../model";

const template = {
  slug: "distributed-tracing",
  name: "Distributed Tracing",
  summary: "親子Spanの生成、サービス間伝播、Trace相関を示します。",
  primaryCategory: "observability-operations",
  tags: ["Distributed Tracing", "observability-operations"],
  concepts: ["Distributed Tracing"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/observability-operations/distributed-tracing",
} as const satisfies DesignTemplate;

export default template;

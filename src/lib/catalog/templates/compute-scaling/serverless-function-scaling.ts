import type { DesignTemplate } from "../../model";

const template = {
  slug: "serverless-function-scaling",
  name: "Serverless Function Scaling",
  summary: "Invocationに応じた同時実行数、cold start、アイドル化を観察します。",
  primaryCategory: "compute-scaling",
  tags: ["Serverless Function Scaling", "compute-scaling"],
  concepts: ["Serverless Function Scaling"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/serverless-function-scaling",
} as const satisfies DesignTemplate;

export default template;

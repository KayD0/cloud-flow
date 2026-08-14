import type { DesignTemplate } from "../../model";

const template = {
  slug: "serverless-function-scaling",
  name: "Serverless Function Scaling",
  summary: "Invocation の増減に応じた同時実行数、Cold Start、Warm Function の再利用、Idle への遷移を合成データで学びます。",
  primaryCategory: "compute-scaling",
  tags: ["Serverless", "Concurrency", "Compute & Scaling"],
  concepts: ["Cold start", "Warm function", "Concurrency limit", "Idle reuse"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "State transition"],
  actions: ["Play", "Pause", "Reset", "Adjust traffic"],
  href: "/templates/compute-scaling/serverless-function-scaling",
} as const satisfies DesignTemplate;

export default template;

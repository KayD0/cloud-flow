import type { DesignTemplate } from "../../model";

const template = {
  slug: "container-lifecycle",
  name: "Container Lifecycle",
  summary: "Containerの作成、起動、処理、停止、再起動をたどります。",
  primaryCategory: "compute-scaling",
  tags: ["Container Lifecycle", "compute-scaling"],
  concepts: ["Container Lifecycle"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/container-lifecycle",
} as const satisfies DesignTemplate;

export default template;

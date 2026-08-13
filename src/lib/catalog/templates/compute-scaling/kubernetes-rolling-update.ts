import type { DesignTemplate } from "../../model";

const template = {
  slug: "kubernetes-rolling-update",
  name: "Kubernetes Rolling Update",
  summary: "新旧世代のPodが段階的に追加・置換される動きを示します。",
  primaryCategory: "compute-scaling",
  tags: ["Kubernetes Rolling Update", "compute-scaling"],
  concepts: ["Kubernetes Rolling Update"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/kubernetes-rolling-update",
} as const satisfies DesignTemplate;

export default template;

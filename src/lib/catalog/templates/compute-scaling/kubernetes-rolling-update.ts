import type { DesignTemplate } from "../../model";

const template = {
  slug: "kubernetes-rolling-update",
  name: "Kubernetes Rolling Update",
  summary: "新旧世代のPodが段階的に追加・draining・置換されるRolling Updateを観察します。",
  primaryCategory: "compute-scaling",
  tags: ["Kubernetes", "Rolling Update", "Compute & Scaling"],
  concepts: ["ReplicaSet", "Pod replacement", "Readiness"],
  difficulty: "Beginner",
  status: "available",
  motions: ["State transition", "Scale out", "Scale in"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/kubernetes-rolling-update",
} as const satisfies DesignTemplate;

export default template;

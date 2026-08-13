import type { DesignTemplate } from "../../model";

const template = {
  slug: "kubernetes-pod-scheduling",
  name: "Kubernetes Pod Scheduling",
  summary: "PodがNodeへ配置され、処理可能になるまでを観察します。",
  primaryCategory: "compute-scaling",
  tags: ["Kubernetes Pod Scheduling", "compute-scaling"],
  concepts: ["Kubernetes Pod Scheduling"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/kubernetes-pod-scheduling",
} as const satisfies DesignTemplate;

export default template;

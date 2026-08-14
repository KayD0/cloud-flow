import type { DesignTemplate } from "../../model";

const template = {
  slug: "kubernetes-pod-scheduling",
  name: "Kubernetes Pod Scheduling",
  summary: "Pending Pod が Scheduler の判断を経て Node に配置され、Ready になるまでを観察します。",
  primaryCategory: "compute-scaling",
  tags: ["Kubernetes", "Pod", "Scheduling"],
  concepts: ["Pending Pod", "Scheduler", "Node capacity", "Pod readiness"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Pod queue", "Scheduling decision", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/kubernetes-pod-scheduling",
} as const satisfies DesignTemplate;

export default template;

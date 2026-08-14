import type { DesignTemplate } from "../../model";

const template = {
  slug: "container-lifecycle",
  name: "Container Lifecycle",
  summary: "Container の作成、起動、処理、停止、再起動というライフサイクルを段階的に追跡します。",
  primaryCategory: "compute-scaling",
  tags: ["Container Lifecycle", "Compute & Scaling", "Vendor neutral"],
  concepts: ["Container Lifecycle", "State transition", "Restart"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Start transition", "Processing", "Stop transition", "Restart transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/container-lifecycle",
} as const satisfies DesignTemplate;

export default template;

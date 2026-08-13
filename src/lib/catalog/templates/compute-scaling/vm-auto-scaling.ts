import type { DesignTemplate } from "../../model";

const template = {
  slug: "vm-auto-scaling",
  name: "VM Auto Scaling",
  summary: "負荷の増減に応じて VM が起動、Ready、Draining、停止へ遷移する判断過程を観察します。",
  primaryCategory: "compute-scaling",
  tags: ["Auto Scaling", "VM", "State transition"],
  concepts: ["Scale out", "Scale in", "Draining", "Capacity boundary"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Load change", "VM state transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/vm-auto-scaling",
} as const satisfies DesignTemplate;

export default template;

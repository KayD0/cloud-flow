import type { DesignTemplate } from "../../model";

const template = {
  slug: "vm-auto-scaling",
  name: "VM Auto Scaling",
  summary: "負荷増減に応じたVMの起動、追加、draining、停止を観察します。",
  primaryCategory: "compute-scaling",
  tags: ["VM Auto Scaling", "compute-scaling"],
  concepts: ["VM Auto Scaling"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/compute-scaling/vm-auto-scaling",
} as const satisfies DesignTemplate;

export default template;

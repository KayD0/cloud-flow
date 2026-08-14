import type { DesignTemplate } from "../../model";

const template = {
  slug: "backup-restore",
  name: "Backup / Restore",
  summary: "Primary Store のデータを Backup 世代として退避し、選択した世代から Restore する流れを示します。",
  primaryCategory: "data-storage",
  tags: ["Backup / Restore", "Data & Storage", "Generations"],
  concepts: ["Backup generation", "Point-in-time restore", "Restore validation"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Data flow", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/backup-restore",
} as const satisfies DesignTemplate;

export default template;

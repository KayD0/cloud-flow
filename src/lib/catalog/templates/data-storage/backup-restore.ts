import type { DesignTemplate } from "../../model";

const template = {
  slug: "backup-restore",
  name: "Backup / Restore",
  summary: "Backup世代の作成と選択した世代からのRestoreを示します。",
  primaryCategory: "data-storage",
  tags: ["Backup / Restore", "data-storage"],
  concepts: ["Backup / Restore"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/backup-restore",
} as const satisfies DesignTemplate;

export default template;

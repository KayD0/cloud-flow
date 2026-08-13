import type { DesignTemplate } from "../../model";

const template = {
  slug: "database-read-write",
  name: "Database Read / Write",
  summary: "ApplicationとDatabase間のReadとWriteの向きを比較します。",
  primaryCategory: "data-storage",
  tags: ["Database Read / Write", "data-storage"],
  concepts: ["Database Read / Write"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/database-read-write",
} as const satisfies DesignTemplate;

export default template;

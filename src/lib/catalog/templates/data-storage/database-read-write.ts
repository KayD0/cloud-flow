import type { DesignTemplate } from "../../model";

const template = {
  slug: "database-read-write",
  name: "Database Read / Write",
  summary: "Application と Database の間で、Write はデータを保存し、Read は保存済みデータを取得するという向きと結果の違いを追跡します。",
  primaryCategory: "data-storage",
  tags: ["Database Read / Write", "Data & Storage", "Vendor neutral"],
  concepts: ["Database Read / Write", "Data persistence", "Data retrieval"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Write transit", "Read transit", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/database-read-write",
} as const satisfies DesignTemplate;

export default template;

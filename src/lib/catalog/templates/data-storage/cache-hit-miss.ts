import type { DesignTemplate } from "../../model";

const template = {
  slug: "cache-hit-miss",
  name: "Cache HIT / MISS",
  summary: "Cache HITとMISSによるデータ取得経路の違いを示します。",
  primaryCategory: "data-storage",
  tags: ["Cache HIT / MISS", "data-storage"],
  concepts: ["Cache HIT / MISS"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "State transition", "Cache update"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/cache-hit-miss",
} as const satisfies DesignTemplate;

export default template;

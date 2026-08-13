import type { CatalogCategory, CategorySlug, DesignTemplate, TemplateCategory } from "./model";

export const templateCategories: readonly TemplateCategory[] = [
  { slug: "traffic-routing", name: "Traffic & Routing", description: "リクエストの入口、分散、ルーティングの流れを理解する。" },
  { slug: "network-connectivity", name: "Network & Connectivity", description: "ネットワーク境界と接続経路を可視化する。" },
  { slug: "compute-scaling", name: "Compute & Scaling", description: "負荷に応じた実行基盤の増減を追う。" },
  { slug: "data-storage", name: "Data & Storage", description: "データの保存、複製、キャッシュの動きを学ぶ。" },
  { slug: "messaging-integration", name: "Messaging & Integration", description: "非同期メッセージとシステム連携をたどる。" },
  { slug: "reliability-recovery", name: "Reliability & Recovery", description: "障害検知、切り替え、復旧の過程を確認する。" },
  { slug: "security", name: "Security", description: "認証、認可、境界防御の判断点を把握する。" },
  { slug: "observability-operations", name: "Observability & Operations", description: "メトリクス、ログ、運用アクションを関連付ける。" },
] as const;

export const designTemplates: readonly DesignTemplate[] = [
  {
    slug: "round-robin-load-balancing",
    name: "Round Robin Load Balancing",
    summary: "正常なサーバーへリクエストを順番に振り分け、障害時の経路変化を観察します。",
    primaryCategory: "traffic-routing",
    tags: ["Load balancing", "Health check", "Failure handling"],
    concepts: ["Client", "Load Balancer", "Server pool"],
    difficulty: "Beginner",
    motions: ["Request distribution", "Failure exclusion", "Recovery"],
    actions: ["Play", "Pause", "Reset", "Adjust traffic", "Inject failure"],
    href: "/templates/round-robin-load-balancing",
  },
] as const;

export function getCatalogCategories(): CatalogCategory[] {
  return templateCategories
    .map((category) => {
      const templates = designTemplates.filter((template) => template.primaryCategory === category.slug);
      return { ...category, templates, isAvailable: templates.length > 0 };
    })
    .sort((left, right) => Number(right.isAvailable) - Number(left.isAvailable));
}

export function getCategory(slug: string): CatalogCategory | undefined {
  return getCatalogCategories().find((category) => category.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return templateCategories.some((category) => category.slug === slug);
}

export function getTemplate(slug: string): DesignTemplate | undefined {
  return designTemplates.find((template) => template.slug === slug);
}

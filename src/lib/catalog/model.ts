export const CATEGORY_SLUGS = [
  "traffic-routing",
  "network-connectivity",
  "compute-scaling",
  "data-storage",
  "messaging-integration",
  "reliability-recovery",
  "security",
  "observability-operations",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export type TemplateDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type TemplateStatus = "available" | "planned";

export type TemplateAction =
  | "Play"
  | "Start"
  | "Pause"
  | "Reset"
  | "Deal request"
  | "Select route"
  | "Send"
  | "Adjust traffic"
  | "Inject failure";

export interface TemplateCategory {
  slug: CategorySlug;
  name: string;
  description: string;
}

/**
 * Catalog metadata only. Scenario state and renderer-specific data deliberately
 * live outside this model so the catalog can evolve independently.
 */
export interface DesignTemplate {
  slug: string;
  name: string;
  summary: string;
  primaryCategory: CategorySlug;
  tags: readonly string[];
  concepts: readonly string[];
  difficulty: TemplateDifficulty;
  status: TemplateStatus;
  motions: readonly string[];
  actions: readonly TemplateAction[];
  href: string;
}

export interface CatalogCategory extends TemplateCategory {
  templates: readonly DesignTemplate[];
  isAvailable: boolean;
}

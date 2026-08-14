import { describe, expect, it } from "vitest";
import { designTemplates, getCatalogCategories, getCategory } from "./catalog";

describe("template catalog", () => {
  it("defines all eight vendor-neutral categories", () => {
    expect(getCatalogCategories()).toHaveLength(8);
  });

  it("places available categories before planned categories", () => {
    const categories = getCatalogCategories();
    const firstPlannedIndex = categories.findIndex((category) => !category.isAvailable);
    expect(firstPlannedIndex).toBeGreaterThan(0);
    expect(categories.slice(0, firstPlannedIndex).every((category) => category.isAvailable)).toBe(true);
    expect(categories.slice(firstPlannedIndex).every((category) => !category.isAvailable)).toBe(true);
  });

  it("assigns every template to exactly one known primary category", () => {
    for (const template of designTemplates) {
      expect(getCategory(template.primaryCategory)).toBeDefined();
      expect(Array.isArray(template.tags)).toBe(true);
    }
  });

  it("pre-registers one isolated catalog entry for every template issue", () => {
    expect(designTemplates).toHaveLength(40);
    expect(new Set(designTemplates.map((template) => template.slug)).size).toBe(40);
    expect(designTemplates.filter((template) => template.status === "available")).toHaveLength(2);
  });
});

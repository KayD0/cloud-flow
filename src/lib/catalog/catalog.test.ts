import { describe, expect, it } from "vitest";
import { designTemplates, getCatalogCategories, getCategory } from "./catalog";

describe("template catalog", () => {
  it("defines all eight vendor-neutral categories", () => {
    expect(getCatalogCategories()).toHaveLength(8);
  });

  it("places available categories before planned categories", () => {
    const categories = getCatalogCategories();
    expect(categories[0].isAvailable).toBe(true);
    expect(categories.slice(1).every((category) => !category.isAvailable)).toBe(true);
  });

  it("assigns every template to exactly one known primary category", () => {
    for (const template of designTemplates) {
      expect(getCategory(template.primaryCategory)).toBeDefined();
      expect(Array.isArray(template.tags)).toBe(true);
    }
  });
});

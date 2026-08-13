import Link from "next/link";
import type { CatalogCategory } from "@/lib/catalog/model";

export function CategoryCard({ category, index }: { category: CatalogCategory; index: number }) {
  return (
    <li>
      <Link className="category-card" href={`/templates/category/${category.slug}`}>
        <span className="category-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <div className="category-title-row">
            <h3>{category.name}</h3>
            <span className={category.isAvailable ? "status available" : "status planned"}>
              {category.isAvailable ? `${category.templates.length} template` : "Planned"}
            </span>
          </div>
          <p>{category.description}</p>
        </div>
        <span className="card-arrow" aria-hidden="true">→</span>
      </Link>
    </li>
  );
}

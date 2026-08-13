import Link from "next/link";
import { DatabaseReadWriteDemo } from "@/components/templates/data-storage/database-read-write/database-read-write-demo";
import { SiteHeader } from "@/components/site-header";
import { getCategory, getTemplate } from "@/lib/catalog/catalog";

export default function DatabaseReadWritePage() {
  const template = getTemplate("database-read-write")!;
  const category = getCategory(template.primaryCategory)!;

  return (
    <main>
      <SiteHeader />
      <div className="page-shell detail-shell">
        <nav className="breadcrumb" aria-label="パンくずリスト">
          <Link href="/#catalog">Categories</Link><span aria-hidden="true">/</span>
          <Link href={`/templates/category/${category.slug}`}>{category.name}</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{template.name}</span>
        </nav>
        <header className="category-hero template-detail-hero">
          <p className="hero-kicker"><span /> INFRASTRUCTURE TEMPLATE</p>
          <h1>{template.name}</h1>
          <p>{template.summary}</p>
          <ul className="tag-list" aria-label="補助タグ">
            {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </header>
        <DatabaseReadWriteDemo />
      </div>
    </main>
  );
}

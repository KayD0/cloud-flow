import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ObjectBlockFileStorageDemo } from "@/components/templates/data-storage/object-block-file-storage/object-block-file-storage-demo";
import { getCategory, getTemplate } from "@/lib/catalog/catalog";

export default function ObjectBlockFileStoragePage() {
  const template = getTemplate("object-block-file-storage")!;
  const category = getCategory(template.primaryCategory)!;
  return (
    <main><SiteHeader /><div className="page-shell detail-shell">
      <nav className="breadcrumb" aria-label="パンくずリスト">
        <Link href="/#catalog">Categories</Link><span aria-hidden="true">/</span>
        <Link href={`/templates/category/${category.slug}`}>{category.name}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{template.name}</span>
      </nav>
      <header className="category-hero template-detail-hero">
        <p className="hero-kicker"><span /> INTERACTIVE TEMPLATE</p><h1>{template.name}</h1><p>{template.summary}</p>
        <ul className="tag-list" aria-label="補助タグ">{template.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </header>
      <ObjectBlockFileStorageDemo />
    </div></main>
  );
}

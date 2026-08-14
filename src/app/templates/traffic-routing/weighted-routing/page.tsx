import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { WeightedRoutingDemo } from "@/components/templates/traffic-routing/weighted-routing/weighted-routing-demo";
import { getCategory, getTemplate } from "@/lib/catalog/catalog";

export default function WeightedRoutingPage() {
  const template = getTemplate("weighted-routing")!;
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
          <p className="hero-kicker"><span /> LEARNING MINI GAME</p>
          <h1>{template.name}</h1>
          <p>{template.summary}</p>
          <ul className="tag-list" aria-label="関連タグ">
            {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </header>
        <WeightedRoutingDemo />
      </div>
    </main>
  );
}

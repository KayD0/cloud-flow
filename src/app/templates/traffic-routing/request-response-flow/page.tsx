import Link from "next/link";
import { RequestResponseFlowDemo } from "@/components/templates/traffic-routing/request-response-flow/request-response-flow-demo";
import { SiteHeader } from "@/components/site-header";
import { getCategory, getTemplate } from "@/lib/catalog/catalog";

export default function RequestResponseFlowPage() {
  const template = getTemplate("request-response-flow")!;
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
          <p className="hero-kicker"><span /> REQUEST / RESPONSE FLOW GAME</p>
          <h1>{template.name}</h1>
          <p>{template.summary}</p>
          <ul className="tag-list" aria-label="補助タグ">
            {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </header>
        <RequestResponseFlowDemo />
      </div>
    </main>
  );
}

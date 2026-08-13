import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCategory, getTemplate } from "@/lib/catalog/catalog";

export function PlannedTemplatePage({ slug }: { slug: string }) {
  const template = getTemplate(slug);
  if (!template) notFound();
  const category = getCategory(template.primaryCategory);
  if (!category) notFound();

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
          <p className="hero-kicker"><span /> PLANNED TEMPLATE</p>
          <h1>{template.name}</h1>
          <p>{template.summary}</p>
          <ul className="tag-list" aria-label="補助タグ">
            {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </header>
        <section className="empty-state" aria-labelledby="planned-heading">
          <span aria-hidden="true">◇</span>
          <p>IMPLEMENTATION READY</p>
          <h2 id="planned-heading">専用ページを準備済みです</h2>
          <p>このテンプレートは個別 Issue で実装予定です。ページとカタログ項目は競合を避けるため先に確保されています。</p>
          <Link href={`/templates/category/${category.slug}`}>{category.name}へ戻る →</Link>
        </section>
      </div>
    </main>
  );
}

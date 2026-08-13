import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/template-card";
import { getCategory, templateCategories } from "@/lib/catalog/catalog";

export function generateStaticParams() {
  return templateCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/templates/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return category ? { title: `${category.name} | Cloud Flow` } : {};
}

export default async function CategoryPage({ params }: PageProps<"/templates/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <main>
      <SiteHeader />
      <div className="page-shell detail-shell">
        <nav className="breadcrumb" aria-label="パンくずリスト">
          <Link href="/#catalog">Categories</Link><span aria-hidden="true">/</span><span aria-current="page">{category.name}</span>
        </nav>
        <header className="category-hero">
          <p className="hero-kicker"><span /> TEMPLATE CATEGORY</p>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </header>
        {category.templates.length > 0 ? (
          <section aria-labelledby="templates-heading">
            <div className="section-heading compact">
              <div><p>AVAILABLE NOW</p><h2 id="templates-heading">Templates</h2></div>
              <p>{category.templates.length}件</p>
            </div>
            <div className="template-grid">
              {category.templates.map((template) => <TemplateCard key={template.slug} template={template} />)}
            </div>
          </section>
        ) : (
          <section className="empty-state" aria-labelledby="empty-heading">
            <span aria-hidden="true">◇</span>
            <p>PLANNED CATEGORY</p>
            <h2 id="empty-heading">テンプレートを準備中です</h2>
            <p>このカテゴリは将来追加予定です。現在利用できるカテゴリからテンプレートを探索できます。</p>
            <Link href="/#catalog">カテゴリ一覧へ戻る →</Link>
          </section>
        )}
      </div>
    </main>
  );
}

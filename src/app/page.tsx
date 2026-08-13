import { CategoryCard } from "@/components/category-card";
import { SiteHeader } from "@/components/site-header";
import { getCatalogCategories } from "@/lib/catalog/catalog";

export default function Home() {
  const categories = getCatalogCategories();

  return (
    <main>
      <SiteHeader />
      <div className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="hero-kicker"><span /> INFRASTRUCTURE TEMPLATE CATALOG</p>
          <h1 id="page-title">Cloud architecture<br /><em>templates.</em></h1>
          <p className="hero-copy">
            インフラ・クラウド構成をすばやく組み立てるための、ベンダーニュートラルな図解テンプレート集です。
          </p>
          <a className="hero-link" href="#catalog">BROWSE TEMPLATES ↓</a>
        </section>

        <section id="catalog" className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p>EXPLORE BY PURPOSE</p>
              <h2 id="catalog-title">Template categories</h2>
            </div>
            <p>用途ごとに構成テンプレートを探せます。</p>
          </div>
          <ul className="category-grid">
            {categories.map((category, index) => (
              <CategoryCard key={category.slug} category={category} index={index} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

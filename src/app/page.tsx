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
          <p className="hero-kicker"><span /> DESIGN TEMPLATE CATALOG</p>
          <h1 id="page-title">Explore how cloud<br /><em>systems move.</em></h1>
          <p className="hero-copy">
            目的から構成を選び、通信、障害、復旧、スケーリングの動きを操作しながら理解できる、
            ベンダーニュートラルなクラウドデザインテンプレート集です。
          </p>
          <a className="hero-link" href="#catalog">BROWSE CATEGORIES ↓</a>
        </section>

        <section id="catalog" className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p>EXPLORE BY PURPOSE</p>
              <h2 id="catalog-title">Template categories</h2>
            </div>
            <p>利用可能なテンプレートがあるカテゴリを先に表示しています。</p>
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

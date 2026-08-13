import { LoadBalancerDemo } from "@/components/load-balancer-demo";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Cloud Flow ホーム"><span>CF</span> CLOUD FLOW</a>
        <nav aria-label="メインナビゲーション"><a href="#demo">Playground</a><a href="#principles">Principles</a><a href="https://github.com/KayD0/cloud-flow">GitHub ↗</a></nav>
      </header>
      <div id="top" className="page-shell">
        <section className="hero">
          <p className="hero-kicker"><span /> INFRASTRUCTURE IN MOTION</p>
          <h1>See how cloud<br /><em>systems move.</em></h1>
          <p className="hero-copy">通信、処理、障害、復旧。静的な構成図では伝わらないクラウドの「動き」を、操作できる React UI で表現します。</p>
          <a className="hero-link" href="#demo">EXPLORE THE SCENARIO ↓</a>
        </section>
        <div id="demo"><LoadBalancerDemo /></div>
        <section id="principles" className="principles">
          <p>CORE PRINCIPLES</p>
          <div>
            <article><span>01</span><h2>Declarative</h2><p>Node、Connection、Scenarioを疎結合なTypeScriptモデルで表現。</p></article>
            <article><span>02</span><h2>Vendor neutral</h2><p>基本概念をコアに置き、ProviderとThemeは交換可能に。</p></article>
            <article><span>03</span><h2>Accessible motion</h2><p>キーボード操作と reduced motion を最初から設計に含める。</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}

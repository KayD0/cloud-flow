import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Node Action | Cloud Flow",
  description: "ノードを動かし、触れ、集め、仕掛けを起動するインタラクティブ表現のテンプレートカタログ。",
};

const actionTemplates = [
  { number: "01", label: "MOVE & PLACE", title: "Free Node Movement", description: "Actor をドラッグまたはキーボードで動かし、盤面の中に自由に配置します。", tags: ["Actor", "Drag", "Keyboard"] },
  { number: "02", label: "COLLECT & REACH", title: "Collectible Quest", description: "アイテムを集め、障害物を避けながら Target への到達を目指します。", tags: ["Collectible", "Target", "Obstacle"] },
  { number: "03", label: "TRIGGER & CHANGE", title: "Switch and Gate", description: "Trigger を起動して Gate の状態を変え、次の経路を開きます。", tags: ["Trigger", "Gate", "State"] },
] as const;

export default function NodeActionsPage() {
  return (
    <main>
      <SiteHeader />
      <div className={`page-shell ${styles.shell}`}>
        <section className={styles.hero} aria-labelledby="node-action-title">
          <div className={styles.heroCopy}>
            <p className="hero-kicker"><span /> INTERACTIVE NODE PLAYGROUND</p>
            <h1 id="node-action-title">Move nodes.<br /><em>Make actions.</em></h1>
            <p>インフラ図の外へ。ノードを自由に動かし、接触・回収・起動といったアクションから、ゲームのように触って理解できるシナリオを組み立てます。</p>
            <a className="hero-link" href="#actions">EXPLORE NODE ACTIONS →</a>
          </div>

          <div className={styles.playground} aria-label="Node Action の構成イメージ">
            <div className={styles.grid} aria-hidden="true" />
            <div className={`${styles.node} ${styles.actor}`}><span className={styles.nodeIcon}>A</span><span>ACTOR</span></div>
            <div className={`${styles.node} ${styles.collectible}`}><span className={styles.diamond} aria-hidden="true" /><span>COLLECT</span></div>
            <div className={`${styles.node} ${styles.target}`}><span className={styles.targetRing} aria-hidden="true" /><span>TARGET</span></div>
            <div className={styles.obstacle} aria-label="Obstacle"><span>OBSTACLE</span></div>
            <div className={styles.path} aria-hidden="true" />
            <p className={styles.hint}>DRAG TO MOVE <span>↗</span></p>
          </div>
        </section>

        <section id="actions" className={styles.actions} aria-labelledby="actions-title">
          <div className="section-heading">
            <div><p>BUILD AN INTERACTION</p><h2 id="actions-title">Node action templates</h2></div>
            <p>移動、接触、状態変化を小さなテンプレートから組み合わせます。</p>
          </div>
          <ul className={styles.actionGrid}>
            {actionTemplates.map((template) => (
              <li key={template.number} className={styles.actionCard}>
                <div className={styles.cardTopline}><span>{template.number}</span><span className={styles.planned}>PLANNED</span></div>
                <p className={styles.cardLabel}>{template.label}</p>
                <h3>{template.title}</h3>
                <p className={styles.cardDescription}>{template.description}</p>
                <ul className="tag-list" aria-label={`${template.title} の要素`}>
                  {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.foundation} aria-labelledby="foundation-title">
          <p className={styles.foundationIndex}>NODE / 001</p>
          <div>
            <p className={styles.cardLabel}>FOUNDATION TEMPLATE</p>
            <h2 id="foundation-title">Interactive Node Playground</h2>
            <p>Actor、Target、Collectible、Obstacle、Hazard、Trigger、Gate。ゲーム的な表現に必要な最小ノードを、ひとつの盤面で検証する基礎テンプレートです。</p>
          </div>
          <Link href="https://github.com/KayD0/cloud-flow/issues/51" className={styles.issueLink}>VIEW ISSUE #51 ↗</Link>
        </section>
      </div>
    </main>
  );
}

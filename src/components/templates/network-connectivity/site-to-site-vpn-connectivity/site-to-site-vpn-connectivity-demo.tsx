"use client";

import { useReducer } from "react";
import { initialVpnGameState, vpnGameReducer, type GameMode, type KeyChoice, type RouteChoice } from "@/lib/scenarios/network-connectivity/site-to-site-vpn-connectivity/site-to-site-vpn-connectivity-scenario";
import styles from "./site-to-site-vpn-connectivity-demo.module.css";

const tunnelLabels = { disconnected: "切断", connected: "接続済み", degraded: "障害発生" } as const;

export function SiteToSiteVpnConnectivityDemo() {
  const [state, dispatch] = useReducer(vpnGameReducer, initialVpnGameState);
  const canOperate = state.playback === "running";

  return <section className={styles.demo} aria-labelledby="vpn-demo-title">
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>NETWORK &amp; CONNECTIVITY · MINI GAME</p><h2 id="vpn-demo-title">VPNトンネル・キーパー</h2><p>Hybrid Network 運用者として、Gateway 間の Tunnel を確立し、切断イベントから通信を復旧してください。</p></div>
      <div className={`${styles.status} ${styles[state.tunnel]}`} aria-live="polite"><span>TUNNEL STATUS</span><strong>{tunnelLabels[state.tunnel]}</strong></div>
    </header>

    <section className={styles.briefing} aria-labelledby="mission-title">
      <div><span>あなたの役割</span><strong>Hybrid Network 運用者</strong></div>
      <div><span id="mission-title">現在の目標</span><strong>{state.incident === "none" ? "Tunnel を確立し、障害を注入する" : "鍵と経路を直して再接続する"}</strong></div>
      <div><span>勝利 / 失敗</span><strong>切断から復旧 / 鍵・経路不一致で通信不能</strong></div>
    </section>

    <div className={styles.modePicker} role="group" aria-label="ゲームモード">
      {(["guided", "challenge"] as GameMode[]).map((mode) => <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => dispatch({ type: "set-mode", mode })}>{mode === "guided" ? "Guided — 手順と理由を表示" : "Challenge — 正確性・安全性・可用性で採点"}</button>)}
    </div>

    <div className={styles.network} role="img" aria-label={`On-premises Gateway と Cloud Gateway の VPN Tunnel。現在は${tunnelLabels[state.tunnel]}。`}>
      <article><span>ON-PREMISES</span><strong>Gateway A</strong><small>鍵 Alpha · 10.20.0.0/16</small></article>
      <div className={`${styles.tunnel} ${styles[state.tunnel]}`}><span aria-hidden="true">◆ ━ ━ ━ ◆</span><strong>暗号化 VPN Tunnel</strong><small>合成ネットワーク</small></div>
      <article><span>CLOUD</span><strong>Gateway B</strong><small>鍵 Alpha · 10.20.0.0/16</small></article>
    </div>

    <div className={styles.transport} aria-label="ゲーム操作">
      <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>Start</button>
      <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Pause</button>
      <button type="button" onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <button type="button" onClick={() => dispatch({ type: "establish" })} disabled={!canOperate || state.tunnel === "connected"}>Tunnel を確立</button>
    </div>

    <section className={styles.playArea} aria-label="復旧判断">
      <div className={styles.incidents}><h3>1. 障害注入</h3><button type="button" onClick={() => dispatch({ type: "inject", incident: "key-mismatch" })} disabled={!canOperate || state.tunnel !== "connected"}>鍵不一致を注入</button><button type="button" onClick={() => dispatch({ type: "inject", incident: "route-mismatch" })} disabled={!canOperate || state.tunnel !== "connected"}>経路不一致を注入</button></div>
      <div><h3>2. 復旧設定</h3><label>事前共有鍵<select value={state.selectedKey} onChange={(event) => dispatch({ type: "select-key", key: event.target.value as KeyChoice })} disabled={!canOperate}><option value="key-alpha">鍵 Alpha</option><option value="key-bravo">鍵 Bravo</option></select></label><label>Cloud 宛先経路<select value={state.selectedRoute} onChange={(event) => dispatch({ type: "select-route", route: event.target.value as RouteChoice })} disabled={!canOperate}><option value="10.20.0.0/16">10.20.0.0/16</option><option value="10.30.0.0/16">10.30.0.0/16</option></select></label><button className={styles.reconnect} type="button" onClick={() => dispatch({ type: "reconnect" })} disabled={!canOperate || state.incident === "none"}>再接続を試す</button></div>
    </section>

    <section className={`${styles.feedback} ${styles[state.result]}`} aria-live="polite"><div><span>判断の結果と理由</span><strong>{state.feedback}</strong></div><dl><div><dt>ROUND</dt><dd>{state.round}</dd></div><div><dt>試行</dt><dd>{state.attempts}</dd></div><div><dt>可用性</dt><dd>{state.availability}%</dd></div><div><dt>SCORE</dt><dd>{state.mode === "challenge" ? state.score : "—"}</dd></div></dl></section>

    {state.result !== "playing" && <div className={styles.resultPanel}><strong>{state.result === "won" ? "ラウンド成功" : "通信不能"}</strong><p>{state.result === "won" ? "同じ固定シナリオへ再挑戦できます。" : "理由を確認して設定を修正し、再接続してください。"}</p><button type="button" onClick={() => dispatch({ type: "reset" })}>同じ条件でもう一度</button></div>}
    {state.mode === "guided" && <aside className={styles.guide}><strong>Guided ヒント</strong><p>{state.incident === "none" ? "Start → Tunnel を確立 → いずれかの障害注入、の順に進めます。" : "対向 Gateway と同じ鍵 Alpha、Cloud 側ネットワークと同じ 10.20.0.0/16 を選びます。"}</p></aside>}
    <p className={styles.disclaimer}>このゲームはベンダーニュートラルな合成データだけを使用し、実環境へ作用しません。値・所要時間・スコアは説明用で、性能・可用性・安全性を保証しません。</p>
  </section>;
}

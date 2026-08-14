"use client";

import { useReducer } from "react";
import {
  describeVpcVnetPeeringState,
  getGuidedStep,
  initialVpcVnetPeeringState,
  vpcVnetPeeringReducer,
  type PeerChoice,
} from "@/lib/scenarios/network-connectivity/vpc-vnet-peering/vpc-vnet-peering-scenario";
import styles from "./vpc-vnet-peering-demo.module.css";

const peers: Array<{ id: Exclude<PeerChoice, null>; name: string; cidr: string; hint: string }> = [
  { id: "network-b", name: "Network B", cidr: "10.20.0.0/16", hint: "非重複" },
  { id: "network-c", name: "Network C", cidr: "10.10.0.0/16", hint: "A と重複" },
];

export function VpcVnetPeeringDemo() {
  const [state, dispatch] = useReducer(vpcVnetPeeringReducer, initialVpcVnetPeeringState);
  const canEdit = state.phase === "playing";
  const selected = peers.find((peer) => peer.id === state.selectedPeer);
  const statusLabel = state.phase === "won" ? "接続成功" : state.phase === "failed" ? "接続失敗" : state.phase === "paused" ? "一時停止" : state.phase === "playing" ? "設計中" : "開始前";

  return (
    <section className={styles.game} aria-labelledby="peering-game-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>NETWORK &amp; CONNECTIVITY · MINI GAME</p>
          <h2 id="peering-game-title">ピアリング・ブリッジ</h2>
          <p className={styles.lead}>接続設計者として、重複しない Network を選び、双方向の経路を完成させてください。</p>
        </div>
        <div className={styles.modeSwitch} aria-label="ゲームモード">
          <button type="button" aria-pressed={state.mode === "guided"} onClick={() => dispatch({ type: "set-mode", mode: "guided" })}>Guided</button>
          <button type="button" aria-pressed={state.mode === "challenge"} onClick={() => dispatch({ type: "set-mode", mode: "challenge" })}>Challenge</button>
        </div>
      </header>

      <div className={styles.briefing} aria-label="ゲーム説明">
        <div><span>ROLE</span><strong>接続設計者</strong></div>
        <div><span>OBJECTIVE</span><strong>Peering で双方向通信を成立</strong></div>
        <div><span>WIN</span><strong>非重複 CIDR + 双方向 Route</strong></div>
        <div><span>FAIL</span><strong>CIDR 重複 / 片方向 Route</strong></div>
      </div>

      <div className={styles.goalBar}>
        <div>
          <span>現在の目標</span>
          <strong>{state.mode === "guided" ? getGuidedStep(state) : "少ない確認回数で、安全かつ完全な接続を構成する"}</strong>
        </div>
        <p className={styles.phase} data-phase={state.phase} aria-live="polite"><span aria-hidden="true">●</span> {statusLabel}</p>
      </div>

      <div className={styles.workspace}>
        <section className={styles.networkMap} aria-labelledby="network-map-title">
          <div className={styles.mapHeading}>
            <h3 id="network-map-title">Network map</h3>
            <span>固定シナリオ · Seed 17</span>
          </div>
          <div className={styles.mapCanvas}>
            <article className={`${styles.node} ${styles.sourceNode}`}>
              <span className={styles.nodeType}>SOURCE</span><strong>Network A</strong><code>10.10.0.0/16</code>
            </article>
            <div className={styles.bridge} data-active={Boolean(state.selectedPeer)}>
              <span className={styles.routeLine} data-enabled={state.routeAToPeer}>A → Peer</span>
              <strong>PEERING<br />BRIDGE</strong>
              <span className={styles.routeLine} data-enabled={state.routePeerToA}>Peer → A</span>
            </div>
            <article className={`${styles.node} ${styles.peerNode}`} data-selected={Boolean(selected)}>
              <span className={styles.nodeType}>SELECTED PEER</span>
              <strong>{selected?.name ?? "未選択"}</strong>
              <code>{selected?.cidr ?? "---.---.---.---/--"}</code>
            </article>
          </div>
          <p className={styles.mapDescription}>実線「設定済み」と破線「未設定」で Route 状態を表示しています。色だけに依存しません。</p>
        </section>

        <section className={styles.actions} aria-labelledby="actions-title">
          <h3 id="actions-title">設計操作</h3>
          <fieldset disabled={!canEdit}>
            <legend>1. Peer を選択</legend>
            <div className={styles.peerChoices}>
              {peers.map((peer) => (
                <button key={peer.id} type="button" aria-pressed={state.selectedPeer === peer.id} onClick={() => dispatch({ type: "select-peer", peer: peer.id })}>
                  <span><strong>{peer.name}</strong><code>{peer.cidr}</code></span><small>{peer.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={!canEdit}>
            <legend>2. Route を設定</legend>
            <label><input type="checkbox" checked={state.routeAToPeer} onChange={() => dispatch({ type: "toggle-route", direction: "a-to-peer" })} /> A → Peer の Route</label>
            <label><input type="checkbox" checked={state.routePeerToA} onChange={() => dispatch({ type: "toggle-route", direction: "peer-to-a" })} /> Peer → A の Route</label>
          </fieldset>
          <button className={styles.checkButton} type="button" disabled={!canEdit} onClick={() => dispatch({ type: "check" })}>疎通確認</button>
        </section>
      </div>

      <section className={styles.feedback} data-result={state.phase} aria-labelledby="feedback-title" aria-live="polite">
        <div><span>RESULT &amp; REASON</span><h3 id="feedback-title">{statusLabel}</h3></div>
        <p>{describeVpcVnetPeeringState(state)}</p>
        {state.score && (
          <div className={styles.score} aria-label={`合計スコア ${state.score.total}点`}>
            <strong>{state.score.total}<small>/100</small></strong>
            <dl><div><dt>正確性</dt><dd>{state.score.accuracy}/40</dd></div><div><dt>安全性</dt><dd>{state.score.safety}/30</dd></div><div><dt>完全性</dt><dd>{state.score.completeness}/30</dd></div></dl>
          </div>
        )}
      </section>

      <footer className={styles.transport} aria-label="ゲーム進行操作">
        <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.phase === "playing"}>Start</button>
        <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.phase !== "playing"}>Pause</button>
        <button type="button" onClick={() => dispatch({ type: "reset" })}>Reset / 再挑戦</button>
        <p>これは合成データによる学習ゲームです。実クラウドへ接続せず、表示値やスコアは性能・可用性・安全性を保証しません。</p>
      </footer>
    </section>
  );
}

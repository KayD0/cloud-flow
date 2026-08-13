"use client";

import { useEffect, useReducer } from "react";
import {
  describeVpcVnetPeeringState,
  initialVpcVnetPeeringState,
  vpcVnetPeeringReducer,
} from "@/lib/scenarios/network-connectivity/vpc-vnet-peering/vpc-vnet-peering-scenario";
import styles from "./vpc-vnet-peering-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

export function VpcVnetPeeringDemo() {
  const [state, dispatch] = useReducer(vpcVnetPeeringReducer, initialVpcVnetPeeringState, (initial) => vpcVnetPeeringReducer(initial, { type: "start" }));
  const isReverse = state.direction === "b-to-a";
  const packetX = isReverse ? 790 - state.progress * 680 : 110 + state.progress * 680;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 260);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useTemplateLoop(state.result === "reachable" || state.result === "blocked", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="peering-demo-title">
      <div className={styles.demoHeader}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="peering-demo-title">VPC / VNet Peering</h2>
          <p className={styles.description}>2つの独立したネットワーク間で、Peering の確立前後に到達可能性がどう変わるかを比較します。</p>
        </div>
        <div className={`${styles.stateBadge} ${styles[state.result]}`} aria-live="polite">
          <span>CURRENT STATE</span>
          <strong>{state.result === "reachable" ? "REACHABLE" : state.result === "blocked" ? "BLOCKED" : state.peering.toUpperCase()}</strong>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 900 410" role="img" aria-labelledby="peering-canvas-title peering-canvas-desc">
          <title id="peering-canvas-title">VPC / VNet Peering の通信経路</title>
          <desc id="peering-canvas-desc">VPC または VNet A と B の間にある Peering を、選択した方向へ通信が通過する様子</desc>
          <defs>
            <marker id="peering-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
          </defs>
          <path className={`${styles.route} ${state.peering === "connected" ? styles.connectedRoute : styles.disconnectedRoute}`} d={isReverse ? "M790 205 H110" : "M110 205 H790"} />
          <g className={styles.network} transform="translate(35 125)">
            <rect width="220" height="160" rx="22" />
            <text x="110" y="65" textAnchor="middle">VPC / VNet A</text>
            <text x="110" y="94" textAnchor="middle" className={styles.cidr}>10.10.0.0/16</text>
            <text x="110" y="124" textAnchor="middle" className={styles.networkState}>ISOLATED NETWORK</text>
          </g>
          <g className={`${styles.peering} ${styles[state.peering]}`} transform="translate(365 145)">
            <path d="M0 20 H170 V100 H0 Z" />
            <text x="85" y="54" textAnchor="middle">⇄ Peering</text>
            <text x="85" y="80" textAnchor="middle" className={styles.peeringState}>{state.peering.toUpperCase()}</text>
          </g>
          <g className={styles.network} transform="translate(645 125)">
            <rect width="220" height="160" rx="22" />
            <text x="110" y="65" textAnchor="middle">VPC / VNet B</text>
            <text x="110" y="94" textAnchor="middle" className={styles.cidr}>10.20.0.0/16</text>
            <text x="110" y="124" textAnchor="middle" className={styles.networkState}>ISOLATED NETWORK</text>
          </g>
          {state.progress > 0 && <g className={`${styles.packet} ${styles[state.result]}`} transform={`translate(${packetX} 205)`} aria-hidden="true"><circle r="12" /><path d={isReverse ? "M6 -4 L-3 0 L6 4" : "M-6 -4 L3 0 L-6 4"} /></g>}
          <text className={styles.directionLabel} x="450" y="344" textAnchor="middle">TRAFFIC: {isReverse ? "B → A" : "A → B"}</text>
        </svg>
      </div>

      <div className={styles.statusPanel} role="status" aria-live="polite">
        <span>判断理由</span><p>{describeVpcVnetPeeringState(state)}</p>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>PLAYBACK</span>
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
            <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
            <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
          </div>
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>PEERING</span>
          <div className={styles.buttonRow}>
            <button type="button" aria-pressed={state.peering === "connected"} onClick={() => dispatch({ type: "connect" })}>Connect</button>
            <button type="button" aria-pressed={state.peering === "disconnected"} onClick={() => dispatch({ type: "disconnect" })}>Disconnect</button>
          </div>
        </div>
        <fieldset className={styles.controlGroup}>
          <legend className={styles.controlLabel}>TRAFFIC DIRECTION</legend>
          <div className={styles.buttonRow}>
            <button type="button" aria-pressed={state.direction === "a-to-b"} onClick={() => dispatch({ type: "set-direction", direction: "a-to-b" })}>A → B</button>
            <button type="button" aria-pressed={state.direction === "b-to-a"} onClick={() => dispatch({ type: "set-direction", direction: "b-to-a" })}>B → A</button>
          </div>
        </fieldset>
      </div>

      <aside className={styles.learningNote}>
        <strong>Why Network &amp; Connectivity?</strong>
        <p>このシナリオの中心は、独立したネットワーク同士の接続状態と通信経路です。計算資源や特定 Provider の設定ではなく、ネットワーク到達可能性を学ぶためこのカテゴリに属します。</p>
        <small>すべて合成データです。実クラウドへ接続せず、表示値は性能・可用性・安全性を保証しません。</small>
      </aside>
    </section>
  );
}

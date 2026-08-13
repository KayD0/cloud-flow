"use client";

import { useEffect, useReducer } from "react";
import {
  getStateExplanation,
  initialPrivateEndpointState,
  privateEndpointReducer,
} from "@/lib/scenarios/network-connectivity/private-link-private-endpoint/private-link-private-endpoint-scenario";
import styles from "./private-link-private-endpoint-demo.module.css";

const outcomeLabels = {
  waiting: "WAITING",
  private: "PRIVATE PATH COMPLETE",
  public: "PUBLIC PATH COMPLETE",
  blocked: "BLOCKED",
} as const;

export function PrivateLinkPrivateEndpointDemo() {
  const [state, dispatch] = useReducer(privateEndpointReducer, initialPrivateEndpointState);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 850);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  const privateActive = state.endpointEnabled && state.step >= 2;
  const publicActive = !state.endpointEnabled && state.comparePublicRoute && state.step >= 2;
  const blocked = state.outcome === "blocked";

  return (
    <section className={styles.demo} aria-labelledby="private-link-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 19</p>
          <h2 id="private-link-demo-title">Private path decision</h2>
          <p className={styles.description}>合成リクエストが非公開経路を選ぶ条件と、Endpoint を無効にしたときの境界動作を比較します。</p>
        </div>
        <div className={`${styles.outcome} ${styles[state.outcome]}`} aria-live="polite">
          <span>現在状態</span><strong>{outcomeLabels[state.outcome]}</strong>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.diagram} aria-label="Private Subnet から Managed Service までの通信経路">
          <div className={`${styles.node} ${state.step >= 1 ? styles.activeNode : ""}`}>
            <span className={styles.nodeKind}>PRIVATE NETWORK</span><strong>Private Subnet</strong><small>合成 client: 10.0.1.24</small>
          </div>
          <div className={`${styles.connector} ${privateActive ? styles.privateLine : ""}`}><span>PRIVATE ROUTE</span></div>
          <div className={`${styles.node} ${styles.endpoint} ${privateActive ? styles.activeNode : ""} ${!state.endpointEnabled ? styles.disabledNode : ""}`}>
            <span className={styles.nodeKind}>INTERFACE</span><strong>Private Endpoint</strong><small>{state.endpointEnabled ? "ENABLED" : "DISABLED"}</small>
          </div>
          <div className={`${styles.connector} ${privateActive ? styles.privateLine : ""}`}><span>PRIVATE LINK</span></div>
          <div className={`${styles.node} ${(state.outcome === "private" || state.outcome === "public") ? styles.activeNode : ""}`}>
            <span className={styles.nodeKind}>PRIVATE SERVICE</span><strong>Managed Service</strong><small>合成データストア</small>
          </div>

          <div className={`${styles.publicRoute} ${publicActive ? styles.publicActive : ""} ${blocked ? styles.blockedRoute : ""}`}>
            <span className={styles.publicBadge}>PUBLIC INTERNET · 比較経路</span>
            <span>{blocked ? "× PUBLIC ACCESS NOT SELECTED" : state.comparePublicRoute ? "- - - PUBLIC ROUTE - - - →" : "PUBLIC ROUTE HIDDEN"}</span>
          </div>
          {state.playback === "running" && <span className={`${styles.packet} ${styles[`step${state.step}`]}`} aria-hidden="true">●</span>}
        </div>

        <aside className={styles.explanation} aria-labelledby="explanation-title">
          <p className={styles.panelLabel}>WHY THIS ROUTE?</p>
          <h3 id="explanation-title">判断理由</h3>
          <p aria-live="polite">{getStateExplanation(state)}</p>
          <dl>
            <div><dt>Endpoint</dt><dd>{state.endpointEnabled ? "有効" : "無効"}</dd></div>
            <div><dt>Public 比較</dt><dd>{state.comparePublicRoute ? "表示・許可" : "非表示・不使用"}</dd></div>
            <div><dt>実環境への作用</dt><dd>なし（合成データ）</dd></div>
          </dl>
        </aside>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.options}>
          <button type="button" aria-pressed={state.endpointEnabled} onClick={() => dispatch({ type: "set-endpoint", enabled: !state.endpointEnabled })}>
            <span>Private Endpoint</span><strong>{state.endpointEnabled ? "ON" : "OFF"}</strong>
          </button>
          <button type="button" aria-pressed={state.comparePublicRoute} onClick={() => dispatch({ type: "set-public-comparison", enabled: !state.comparePublicRoute })}>
            <span>Public 経路と比較</span><strong>{state.comparePublicRoute ? "ON" : "OFF"}</strong>
          </button>
        </div>
      </div>

      <footer className={styles.note}>
        <strong>なぜ Network &amp; Connectivity?</strong>
        <span>このテンプレートの中心は認可やサービス設定ではなく、Subnet・Endpoint・公開境界の間で通信経路を選択するネットワーク設計だからです。</span>
      </footer>
    </section>
  );
}

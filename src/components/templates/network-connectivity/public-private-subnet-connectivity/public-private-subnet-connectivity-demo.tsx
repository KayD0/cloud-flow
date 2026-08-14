"use client";

import { useEffect, useReducer } from "react";
import { initialPublicPrivateSubnetState, publicPrivateSubnetReducer, type ConnectionSource, type ConnectionTarget } from "@/lib/scenarios/network-connectivity/public-private-subnet-connectivity/public-private-subnet-connectivity-scenario";
import styles from "./public-private-subnet-connectivity-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const sourceLabels: Record<ConnectionSource, string> = { internet: "Internet", internal: "Internal Client" };
const targetLabels: Record<ConnectionTarget, string> = { public: "Public Subnet Resource", private: "Private Subnet Resource" };

function packetPosition(source: ConnectionSource, target: ConnectionTarget, step: number) {
  const start = source === "internet" ? { x: 95, y: 120 } : { x: 95, y: 350 };
  const boundary = { x: 390, y: target === "public" ? 170 : 330 };
  const end = { x: 715, y: target === "public" ? 170 : 330 };
  if (step === 0) return start;
  if (step === 1) return boundary;
  if (step === 2) return { x: 525, y: boundary.y };
  return end;
}

export function PublicPrivateSubnetConnectivityDemo() {
  const [state, dispatch] = useReducer(publicPrivateSubnetReducer, initialPublicPrivateSubnetState, (initial) => publicPrivateSubnetReducer(initial, { type: "start" }));
  const position = packetPosition(state.source, state.target, state.step);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 850);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useTemplateLoop(state.playback === "completed" || state.playback === "blocked", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="subnet-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01 · SYNTHETIC ONLY</p>
          <h2 id="subnet-demo-title">Public / Private Subnet Connectivity</h2>
          <p>外部・内部の接続元と Subnet 境界の関係を、合成パケットで比較します。実環境には作用しません。</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.outcome]}`} aria-live="polite">
          <span>CURRENT STATE</span><strong>{state.statusName}</strong>
        </div>
      </div>

      <div className={styles.workspace}>
        <svg className={styles.canvas} viewBox="0 0 840 500" role="img" aria-labelledby="flow-title flow-desc">
          <title id="flow-title">Internet または Internal Client から Public / Private Subnet Resource への接続フロー</title>
          <desc id="flow-desc">選択した経路を点線、合成パケットを円、到達または遮断状態をラベルと形状で表示します。</desc>
          <defs><marker id="subnet-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker></defs>
          <rect className={styles.network} x="350" y="55" width="455" height="390" rx="24" />
          <text className={styles.networkLabel} x="375" y="88">SYNTHETIC NETWORK</text>
          <rect className={`${styles.subnet} ${styles.publicSubnet}`} x="480" y="110" width="285" height="120" rx="18" />
          <rect className={`${styles.subnet} ${styles.privateSubnet}`} x="480" y="270" width="285" height="120" rx="18" />
          <text className={styles.subnetTitle} x="505" y="140">PUBLIC SUBNET</text>
          <text className={styles.subnetTitle} x="505" y="300">PRIVATE SUBNET</text>
          <g className={styles.node} transform="translate(35 78)"><rect width="120" height="84" rx="16" /><text x="60" y="37" textAnchor="middle">Internet</text><text className={styles.nodeState} x="60" y="59" textAnchor="middle">EXTERNAL</text></g>
          <g className={styles.node} transform="translate(35 308)"><rect width="120" height="84" rx="16" /><text x="60" y="37" textAnchor="middle">Internal Client</text><text className={styles.nodeState} x="60" y="59" textAnchor="middle">INTERNAL</text></g>
          <g className={`${styles.gateway} ${!state.gatewayEnabled ? styles.disabled : ""}`} transform="translate(335 125)"><path d="M0 0 H100 V90 H0 Z" /><text x="50" y="38" textAnchor="middle">Gateway</text><text className={styles.nodeState} x="50" y="61" textAnchor="middle">{state.gatewayEnabled ? "ENABLED" : "DISABLED"}</text></g>
          <g className={styles.resource} transform="translate(635 145)"><rect width="100" height="52" rx="12" /><text x="50" y="31" textAnchor="middle">Resource</text></g>
          <g className={styles.resource} transform="translate(635 305)"><rect width="100" height="52" rx="12" /><text x="50" y="31" textAnchor="middle">Resource</text></g>
          <path className={`${styles.route} ${state.source === "internet" && state.target === "public" ? styles.selectedRoute : ""}`} d="M155 120 L335 170 H635" />
          <path className={`${styles.route} ${state.source === "internet" && state.target === "private" ? styles.selectedRoute : ""}`} d="M155 120 L390 330 H635" />
          <path className={`${styles.route} ${state.source === "internal" && state.target === "public" ? styles.selectedRoute : ""}`} d="M155 350 L390 170 H635" />
          <path className={`${styles.route} ${state.source === "internal" && state.target === "private" ? styles.selectedRoute : ""}`} d="M155 350 L390 330 H635" />
          {(state.playback !== "idle" || state.step > 0) && <g className={`${styles.packet} ${styles[state.outcome]}`} transform={`translate(${position.x} ${position.y})`} aria-hidden="true"><circle r="12" /><text y="4" textAnchor="middle">●</text></g>}
          {state.outcome !== "pending" && <g className={`${styles.resultMark} ${styles[state.outcome]}`} transform={`translate(${position.x - 112} ${position.y - 52})`}><rect width="112" height="34" rx="9" /><text x="56" y="22" textAnchor="middle">{state.outcome === "reachable" ? "✓ REACHABLE" : "× BLOCKED"}</text></g>}
        </svg>

        <aside className={styles.explanation} aria-live="polite">
          <p className={styles.eyebrow}>WHY THIS HAPPENED</p>
          <h3>{state.statusName}</h3><p>{state.explanation}</p>
          <dl><div><dt>Source</dt><dd>{sourceLabels[state.source]}</dd></div><div><dt>Destination</dt><dd>{targetLabels[state.target]}</dd></div><div><dt>Gateway</dt><dd>{state.gatewayEnabled ? "Enabled" : "Disabled"}</dd></div></dl>
        </aside>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <label><span>接続元</span><select value={state.source} onChange={(event) => dispatch({ type: "set-source", source: event.target.value as ConnectionSource })}><option value="internet">Internet</option><option value="internal">Internal Client</option></select></label>
        <label><span>接続先</span><select value={state.target} onChange={(event) => dispatch({ type: "set-target", target: event.target.value as ConnectionTarget })}><option value="public">Public Subnet Resource</option><option value="private">Private Subnet Resource</option></select></label>
        <label className={styles.switch}><input type="checkbox" checked={state.gatewayEnabled} onChange={(event) => dispatch({ type: "set-gateway", enabled: event.target.checked })} /><span>Gateway {state.gatewayEnabled ? "Enabled" : "Disabled"}</span></label>
        <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
      </div>

      <div className={styles.learningNote}><strong>Why Network &amp; Connectivity?</strong><p>学習の中心が Firewall の個別ルールではなく、Subnet の境界、経路、Gateway による到達可能範囲だからです。表示値と所要時間は説明用で、性能・可用性・安全性を保証しません。</p></div>
    </section>
  );
}

"use client";

import { useEffect, useReducer } from "react";
import { dnsScenarioReducer, initialDnsScenarioState, phaseDescriptions } from "@/lib/scenarios/traffic-routing/dns-resolution-and-failover/dns-resolution-and-failover-scenario";
import styles from "./dns-resolution-and-failover-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const endpointLabel = { primary: "Primary", secondary: "Secondary" } as const;
const TOKEN_X = [115, 325, 535, 790] as const;

export function DnsResolutionAndFailoverDemo() {
  const [state, dispatch] = useReducer(dnsScenarioReducer, initialDnsScenarioState, (initial) => dnsScenarioReducer(initial, { type: "start" }));
  const status = phaseDescriptions[state.phase];
  const tokenY = state.requestStep < 3 ? 225 : state.cachedRecord === "secondary" ? 345 : 105;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 850);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useTemplateLoop(state.requestStep >= 4, () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="dns-demo-title">
      <div className={styles.demoHeader}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 02</p>
          <h2 id="dns-demo-title">DNS Resolution and Failover</h2>
          <p className={styles.description}>Client の問い合わせ、Resolver の TTL キャッシュ、Primary / Secondary への接続を順に追跡します。</p>
        </div>
        <div className={styles.liveStat} aria-label={`TTL 残り ${state.ttlRemaining} 秒`}>
          <span>CACHE TTL</span><strong>{state.ttlRemaining.toString().padStart(2, "0")}s</strong>
        </div>
      </div>

      <div className={styles.statusPanel} aria-live="polite">
        <span className={styles.statusMark} aria-hidden="true">{state.phase.includes("failure") ? "!" : "i"}</span>
        <div><strong>{status.title}</strong><p>{status.detail}</p></div>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 920 450" role="img" aria-labelledby="dns-canvas-title dns-canvas-desc">
          <title id="dns-canvas-title">DNS 名前解決とフェイルオーバーの流れ</title>
          <desc id="dns-canvas-desc">Client から DNS Resolver を経由し、Primary または Secondary Endpoint へ接続する流れ。</desc>
          <defs><marker id="dns-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker></defs>
          <g className={styles.connections}>
            <path d="M175 225 H275" /><path d="M415 225 H525" />
            <path className={state.cachedRecord === "primary" ? styles.activePath : styles.inactivePath} d="M665 225 L730 105" />
            <path className={state.cachedRecord === "secondary" ? styles.activePath : styles.inactivePath} d="M665 225 L730 345" />
          </g>
          <g className={styles.node} transform="translate(45 175)"><rect width="130" height="100" rx="18" /><text x="65" y="45" textAnchor="middle" className={styles.nodeIcon}>C</text><text x="65" y="73" textAnchor="middle">Client</text></g>
          <g className={`${styles.node} ${styles.resolver}`} transform="translate(275 160)"><rect width="140" height="130" rx="20" /><text x="70" y="37" textAnchor="middle" className={styles.nodeIcon}>DNS</text><text x="70" y="67" textAnchor="middle">Resolver</text><text x="70" y="91" textAnchor="middle" className={styles.microLabel}>CACHE: {state.cachedRecord ? endpointLabel[state.cachedRecord].toUpperCase() : "EMPTY"}</text><text x="70" y="110" textAnchor="middle" className={styles.microLabel}>TTL {state.ttlRemaining}s</text></g>
          <g className={`${styles.node} ${styles.authority}`} transform="translate(525 170)"><rect width="140" height="110" rx="18" /><text x="70" y="42" textAnchor="middle">DNS Record</text><text x="70" y="68" textAnchor="middle" className={styles.microLabel}>AUTHORITATIVE</text><text x="70" y="91" textAnchor="middle" className={styles.recordValue}>→ {endpointLabel[state.authoritativeRecord]}</text></g>
          <g className={`${styles.node} ${state.primaryStatus === "down" ? styles.down : styles.healthy}`} transform="translate(730 60)"><rect width="150" height="90" rx="18" /><path className={styles.endpointShape} d="M18 19h12v12H18z" /><text x="75" y="43" textAnchor="middle">Primary</text><text x="75" y="66" textAnchor="middle" className={styles.statusText}>{state.primaryStatus.toUpperCase()}</text></g>
          <g className={`${styles.node} ${styles.standby}`} transform="translate(730 300)"><rect width="150" height="90" rx="18" /><path className={styles.endpointShape} d="M18 18l7 12 7-12z" /><text x="75" y="43" textAnchor="middle">Secondary</text><text x="75" y="66" textAnchor="middle" className={styles.statusText}>READY</text></g>
          {state.playback === "running" && <g className={styles.requestToken} aria-hidden="true"><circle cx={TOKEN_X[state.requestStep]} cy={tokenY} r="9" /><text x={TOKEN_X[state.requestStep]} y={tokenY + 4} textAnchor="middle">{state.requestStep + 1}</text></g>}
        </svg>
      </div>

      <div className={styles.legend} aria-label="図の凡例"><span><i className={styles.solidLine} /> 現在の接続経路</span><span><i className={styles.dashedLine} /> 未選択の経路</span><span><i className={styles.square} /> Primary</span><span><i className={styles.triangle} /> Secondary</span></div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.dangerButton} onClick={() => dispatch({ type: "fail-primary" })} disabled={state.primaryStatus === "down"}>Primary 障害</button>
          <button type="button" onClick={() => dispatch({ type: "expire-ttl" })} disabled={state.cachedRecord === null}>TTL 経過</button>
          <button type="button" onClick={() => dispatch({ type: "switch-record" })} disabled={state.authoritativeRecord === "secondary"}>レコードを Secondary へ</button>
        </div>
      </div>

      <div className={styles.explanation}>
        <div><span>WHY TRAFFIC &amp; ROUTING?</span><p>学習の中心がサービス復旧そのものではなく、名前解決結果によって Client の通信先が選ばれる仕組みだからです。</p></div>
        <div><span>SAFE SANDBOX</span><p>表示するアドレス、TTL、障害はすべて説明用の合成状態です。実 DNS や実サービスへ接続しません。</p></div>
      </div>
    </section>
  );
}

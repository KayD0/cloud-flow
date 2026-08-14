"use client";

import { useEffect, useReducer } from "react";
import { initialRetryDeadLetterState, retryDeadLetterReducer, retryTickMilliseconds } from "@/lib/scenarios/messaging-integration/retry-and-dead-letter-queue/retry-and-dead-letter-queue-scenario";
import styles from "./retry-and-dead-letter-queue-demo.module.css";

const PLAYBACK_LABELS = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;

export function RetryAndDeadLetterQueueDemo() {
  const [state, dispatch] = useReducer(retryDeadLetterReducer, initialRetryDeadLetterState);
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), retryTickMilliseconds);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stage, state.retryCount]);

  return <section className={styles.demo} aria-labelledby="retry-demo-title">
    <div className={styles.header}><div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p><h2 id="retry-demo-title">Retry and Dead Letter Queue</h2><p className={styles.description}>Queue → Consumer failure → Retry wait → Consumer / DLQ の判断を、1件の合成メッセージで追跡します。</p></div><div className={styles.badge} data-playback={state.playback}><span>CURRENT STATE</span><strong>{PLAYBACK_LABELS[state.playback]}</strong></div></div>
    <div className={styles.status} aria-live="polite"><strong>{state.stage.toUpperCase()}</strong><span>{state.message}</span></div>

    <div className={styles.flow} role="img" aria-label={`現在は${state.stage}。Retry ${state.retryCount}/${state.retryLimit}、DLQ ${state.dlqCount}件`}>
      <div className={`${styles.node} ${state.stage === "queued" ? styles.active : ""}`}><span className={styles.circle}>Q</span><small>01 · SOURCE</small><strong>Queue</strong><em>msg-001</em></div>
      <div className={styles.solidArrow}><span>deliver</span>→</div>
      <div className={`${styles.node} ${state.stage === "consuming" ? styles.active : ""}`}><span className={styles.square}>C</span><small>02 · PROCESS</small><strong>Consumer</strong><em>{state.failureInjected ? "FAILURE INJECTED" : "HEALTHY"}</em></div>
      <div className={styles.branches}><div className={styles.success}><span>success ───→</span><div className={`${styles.outcome} ${state.stage === "delivered" ? styles.active : ""}`}><b>✓</b><strong>Delivered</strong></div></div><div className={styles.retry}><span>failure ┄┄→</span><div className={`${styles.wait} ${state.stage === "retry-wait" ? styles.active : ""}`}><b>◇</b><strong>Retry wait</strong><small>{state.retryCount} / {state.retryLimit}</small></div><span>┄┄ retry ↩</span></div><div className={styles.dead}><span>limit reached ┄┄→</span><div className={`${styles.outcome} ${styles.dlq} ${state.stage === "dlq" ? styles.active : ""}`}><b>◆</b><strong>DLQ</strong><small>{state.dlqCount} message</small></div></div></div>
    </div>

    <div className={styles.controls} aria-label="シナリオ操作"><div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div><label className={styles.toggle}><input type="checkbox" checked={state.failureInjected} disabled={state.playback === "completed"} onChange={(event) => dispatch({ type: "set-failure", enabled: event.target.checked })} /><span>失敗を注入</span></label><label className={styles.limit}><span>Retry 上限 <output>{state.retryLimit}</output></span><input aria-label="Retry上限" type="range" min="0" max="5" value={state.retryLimit} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-retry-limit", retryLimit: Number(event.target.value) })} /></label><button className={styles.reprocess} type="button" disabled={state.stage !== "dlq"} onClick={() => dispatch({ type: "reprocess-dlq" })}>DLQ を再処理</button></div>
    <div className={styles.footer}><div><span>RETRY</span><strong>{state.retryCount} / {state.retryLimit}</strong></div><div><span>DELIVERED</span><strong>{state.deliveryCount}</strong></div><div><span>DLQ</span><strong>{state.dlqCount}</strong></div><p><b>Why Messaging &amp; Integration?</b> このシナリオの中心はサービス内部の復旧ではなく、Queue と Consumer 間のメッセージ配送、再配送、隔離です。すべて説明用の合成データで、実 Broker や実クラウドには接続しません。</p></div>
  </section>;
}

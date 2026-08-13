"use client";

import { useEffect, useReducer } from "react";
import { getStateExplanation, initialPrimaryReplicaState, primaryReplicaReducer } from "@/lib/scenarios/data-storage/primary-and-read-replica/primary-and-read-replica-scenario";
import styles from "./primary-and-read-replica-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const outcomeLabels = { waiting: "READY", "write-replicated": "REPLICATED · v2", "read-fresh": "FRESH READ · v2", "read-stale": "STALE READ · v1" } as const;

export function PrimaryAndReadReplicaDemo() {
  const [state, dispatch] = useReducer(primaryReplicaReducer, initialPrimaryReplicaState, (initial) => primaryReplicaReducer(initial, { type: "start" }));
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 800);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  const primaryRead = state.operation === "read" && state.readTarget === "primary";
  const replicaRead = state.operation === "read" && state.readTarget === "replica";
  const active = (step: number) => state.step >= step;

  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="primary-replica-demo-title">
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 28</p><h2 id="primary-replica-demo-title">Write, replicate, then read</h2><p className={styles.description}>合成値 v2 の経路を追い、Read の分散先と複製方式・遅延が結果へどう影響するか比較します。</p></div>
        <div className={`${styles.outcome} ${styles[state.outcome]}`} aria-live="polite"><span>現在状態</span><strong>{outcomeLabels[state.outcome]}</strong></div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.diagram} aria-label="Application から Primary、Replication、Read Replica、Reader へのデータ経路">
          <div className={`${styles.node} ${active(1) ? styles.activeNode : ""}`}><span>CLIENT</span><strong>Application</strong><small>{state.operation.toUpperCase()} · synthetic v2</small></div>
          <div className={`${styles.connector} ${active(1) ? styles.writeLine : ""}`}><span>{state.operation === "write" ? "WRITE" : primaryRead ? "READ ROUTE" : "ROUTE"}</span></div>
          <div className={`${styles.node} ${styles.database} ${(active(1) || primaryRead) ? styles.activeNode : ""}`}><span>DATABASE</span><strong>Primary</strong><small>latest: v2</small></div>
          <div className={`${styles.connector} ${styles.replication} ${active(2) ? styles.replicationLine : ""}`}><span>{state.replicationMode.toUpperCase()} · {state.replicationLagMs}ms</span></div>
          <div className={`${styles.node} ${styles.database} ${(active(3) || replicaRead) ? styles.activeNode : ""} ${state.outcome === "read-stale" ? styles.staleNode : ""}`}><span>DATABASE</span><strong>Read Replica</strong><small>{state.outcome === "read-stale" ? "visible: v1" : "visible: v2"}</small></div>
          <div className={`${styles.connector} ${active(3) ? styles.readLine : ""}`}><span>READ</span></div>
          <div className={`${styles.node} ${active(4) ? styles.activeNode : ""}`}><span>CONSUMER</span><strong>Reader</strong><small>{state.outcome === "read-stale" ? "received: v1" : active(4) ? "received: v2" : "waiting"}</small></div>
          {state.playback === "running" && <span className={`${styles.packet} ${styles[`step${state.step}`]}`} aria-hidden="true">◆</span>}
        </div>

        <aside className={styles.explanation} aria-labelledby="replica-explanation-title">
          <p className={styles.panelLabel}>WHAT IS HAPPENING?</p><h3 id="replica-explanation-title">状態と判断理由</h3>
          <p aria-live="polite">{getStateExplanation(state)}</p>
          <dl>
            <div><dt>Operation</dt><dd>{state.operation.toUpperCase()}</dd></div>
            <div><dt>Replication</dt><dd>{state.replicationMode === "sync" ? "同期" : "非同期"}</dd></div>
            <div><dt>Read target</dt><dd>{state.readTarget === "primary" ? "Primary" : "Read Replica"}</dd></div>
            <div><dt>実環境への作用</dt><dd>なし（合成値）</dd></div>
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
          <fieldset><legend>Operation</legend><button type="button" aria-pressed={state.operation === "write"} onClick={() => dispatch({ type: "set-operation", operation: "write" })}>Write</button><button type="button" aria-pressed={state.operation === "read"} onClick={() => dispatch({ type: "set-operation", operation: "read" })}>Read</button></fieldset>
          <fieldset><legend>Replication</legend><button type="button" aria-pressed={state.replicationMode === "sync"} onClick={() => dispatch({ type: "set-replication-mode", mode: "sync" })}>同期</button><button type="button" aria-pressed={state.replicationMode === "async"} onClick={() => dispatch({ type: "set-replication-mode", mode: "async" })}>非同期</button></fieldset>
          <fieldset><legend>Read target</legend><button type="button" aria-pressed={state.readTarget === "primary"} onClick={() => dispatch({ type: "set-read-target", target: "primary" })}>Primary</button><button type="button" aria-pressed={state.readTarget === "replica"} onClick={() => dispatch({ type: "set-read-target", target: "replica" })}>Replica</button></fieldset>
          <label className={styles.lag}>複製遅延 <strong>{state.replicationLagMs}ms</strong><input type="range" min="0" max="2000" step="200" value={state.replicationLagMs} disabled={state.replicationMode === "sync"} onChange={(event) => dispatch({ type: "set-lag", lagMs: Number(event.target.value) })} /></label>
        </div>
      </div>

      <footer className={styles.note}><strong>なぜ Data &amp; Storage?</strong><span>中心となる判断がネットワーク経路ではなく、書き込み先、複製方式、読み取り先、一貫性というデータ配置とデータ状態の設計だからです。表示値と時間は学習用で、性能・可用性・安全性を保証しません。</span></footer>
    </section>
  );
}

"use client";

import { useEffect, useReducer } from "react";
import { databaseReplicaPromotionReducer, describeDatabaseReplicaPromotionState, initialDatabaseReplicaPromotionState, type PromotionPhase } from "@/lib/scenarios/reliability-recovery/database-replica-promotion/database-replica-promotion-scenario";
import styles from "./database-replica-promotion-demo.module.css";

const phases: { id: PromotionPhase; label: string; detail: string }[] = [
  { id: "healthy", label: "Healthy", detail: "Primary writing" },
  { id: "primary-down", label: "Primary Down", detail: "Writes stopped" },
  { id: "promoting", label: "Replica Promoting", detail: "Role changing" },
  { id: "connection-switch", label: "Connection switch", detail: "Route updating" },
  { id: "recovered", label: "Recovered", detail: "Writes resumed" },
];

export function DatabaseReplicaPromotionDemo() {
  const [state, dispatch] = useReducer(databaseReplicaPromotionReducer, initialDatabaseReplicaPromotionState);
  const currentIndex = phases.findIndex((phase) => phase.id === state.phase);
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1100);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.demo} aria-labelledby="promotion-demo-title">
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE RECOVERY RUNBOOK</p><h2 id="promotion-demo-title">Promote, switch, recover</h2><p className={styles.description}>障害検知から提供再開まで、役割変更と接続変更を順序立てて追跡します。</p></div>
        <div className={`${styles.badge} ${styles[state.notice === "none" ? state.phase : "rejected"]}`} aria-live="polite"><span>CURRENT STATE</span><strong>{state.notice === "none" ? phases[currentIndex].label : "ACTION REJECTED"}</strong></div>
      </div>

      <ol className={styles.progressTrack} aria-label="復旧状態の進行">
        {phases.map((phase, index) => <li key={phase.id} className={`${index < currentIndex ? styles.done : ""} ${index === currentIndex ? styles.current : ""}`} aria-current={index === currentIndex ? "step" : undefined}><span className={styles.marker}>{index < currentIndex ? "✓" : index + 1}</span><strong>{phase.label}</strong><small>{phase.detail}</small></li>)}
      </ol>

      <div className={styles.topology} aria-label="Application、Primary、Replica の接続状態">
        <article className={styles.application}><span>CLIENT</span><strong>Application</strong><small>{state.phase === "primary-down" || state.phase === "promoting" ? "WRITE PAUSED" : state.phase === "healthy" ? "→ PRIMARY" : "→ NEW PRIMARY"}</small></article>
        <div className={`${styles.connection} ${currentIndex >= 3 ? styles.switched : ""}`}><span>{currentIndex >= 3 ? "SWITCHED ROUTE" : "WRITE ROUTE"}</span></div>
        <article className={`${styles.database} ${state.phase === "primary-down" ? styles.down : ""}`}><span>DATABASE</span><strong>Primary</strong><small>{state.phase === "healthy" ? "ACTIVE / WRITER" : "DOWN / ISOLATED"}</small></article>
        <div className={styles.replication}><span>REPLICATION</span></div>
        <article className={`${styles.database} ${currentIndex >= 2 ? styles.promoted : ""}`}><span>DATABASE</span><strong>{currentIndex >= 3 ? "New Primary" : "Replica"}</strong><small>{state.phase === "promoting" ? "PROMOTING" : currentIndex >= 3 ? "ACTIVE / WRITER" : "STANDBY"}</small></article>
      </div>

      <div className={`${styles.status} ${state.notice !== "none" ? styles.warning : ""}`} role="status" aria-live="polite"><span>判断理由</span><p>{describeDatabaseReplicaPromotionState(state)}</p></div>

      <div className={styles.controls}>
        <div><span className={styles.controlLabel}>PLAYBACK</span><div className={styles.buttons}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div></div>
        <fieldset><legend className={styles.controlLabel}>MANUAL RECOVERY ACTIONS</legend><div className={styles.buttons}><button type="button" onClick={() => dispatch({ type: "fail-primary" })}>1. Fail Primary</button><button type="button" onClick={() => dispatch({ type: "promote-replica" })}>2. Promote Replica</button><button type="button" onClick={() => dispatch({ type: "switch-connection" })}>3. Switch Connection</button></div></fieldset>
      </div>

      <aside className={styles.note}><strong>Why Reliability &amp; Recovery?</strong><p>中心となる判断はデータ配置そのものではなく、障害後に安全な順序で役割と接続先を変更し、サービスを復旧することです。</p><small>すべて合成データで、実クラウドや実 Database へ作用しません。表示時間は説明用で、性能・可用性・安全性を保証しません。</small></aside>
    </section>
  );
}

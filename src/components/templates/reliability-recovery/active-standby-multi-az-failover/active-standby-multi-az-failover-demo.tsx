"use client";

import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import { failoverPhaseDetails, failoverScenarioReducer, initialFailoverScenarioState, type FailoverPhase } from "@/lib/scenarios/reliability-recovery/active-standby-multi-az-failover/active-standby-multi-az-failover-scenario";
import styles from "./active-standby-multi-az-failover-demo.module.css";

const phaseOrder: FailoverPhase[] = ["active-healthy", "down", "standby-promoting", "recovered"];

export function ActiveStandbyMultiAzFailoverDemo() {
  const [state, dispatch] = useReducer(failoverScenarioReducer, initialFailoverScenarioState, (initial) =>
    failoverScenarioReducer(failoverScenarioReducer(initial, { type: "inject-failure" }), { type: "begin-failover" }),
  );
  const detail = failoverPhaseDetails[state.phase];
  const currentIndex = phaseOrder.indexOf(state.phase);

  useEffect(() => {
    if (state.playback !== "running" || state.phase !== "standby-promoting") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 700);
    return () => window.clearInterval(timer);
  }, [state.phase, state.playback]);
  useEffect(() => { if (state.phase === "standby-promoting" && state.promotionProgress === 100) dispatch({ type: "confirm-recovery" }); }, [state.phase, state.promotionProgress]);
  useTemplateLoop(state.phase === "recovered", () => { dispatch({ type: "reset" }); dispatch({ type: "inject-failure" }); dispatch({ type: "begin-failover" }); });

  return (
    <section className={styles.demo} aria-labelledby="failover-demo-title">
      <header className={styles.demoHeader}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 39</p><h2 id="failover-demo-title">Active / Standby Multi-AZ Failover</h2><p className={styles.description}>障害の判定、Standby の昇格、復旧確認という判断順序を、合成した 2 つの AZ で追跡します。</p></div>
        <div className={styles.progressStat} aria-label={`昇格進捗 ${state.promotionProgress}%`}><span>PROMOTION</span><strong>{state.promotionProgress.toString().padStart(3, "0")}%</strong></div>
      </header>

      <ol className={styles.timeline} aria-label="Failover の状態遷移">
        {phaseOrder.map((phase, index) => {
          const item = failoverPhaseDetails[phase];
          const status = index === currentIndex ? "current" : index < currentIndex ? "complete" : "upcoming";
          return <li key={phase} className={styles[status]} aria-current={status === "current" ? "step" : undefined}><span>{item.step}</span><strong>{item.title}</strong></li>;
        })}
      </ol>

      <div className={`${styles.statusPanel} ${state.outcome === "action-rejected" ? styles.warning : ""}`} aria-live="polite">
        <span className={styles.statusShape} aria-hidden="true">{state.outcome === "action-rejected" ? "!" : detail.step}</span>
        <div><strong>{detail.title}</strong><p>{state.reason}</p></div>
      </div>

      <div className={styles.canvas} role="img" aria-label={`現在の状態は ${detail.title}。トラフィック経路は ${state.routedAz === "az-a" ? "AZ-A" : state.routedAz === "az-b" ? "AZ-B" : "遮断中"}です。`}>
        <div className={styles.client}><span>REQUESTS</span><strong>Client traffic</strong></div>
        <div className={styles.routes} aria-hidden="true"><i className={state.routedAz === "az-a" ? styles.routeActive : styles.routeInactive} /><i className={state.routedAz === "az-b" ? styles.routeActive : styles.routeInactive} /></div>
        <article className={`${styles.zone} ${styles.zoneActive} ${state.phase !== "active-healthy" ? styles.zoneDown : ""}`}>
          <span className={styles.zoneLabel}>AVAILABILITY ZONE A</span><div className={styles.squareIcon} aria-hidden="true" /><h3>Active</h3>
          <p>{state.phase === "active-healthy" ? "HEALTHY" : "DOWN"}</p><small>{state.phase === "active-healthy" ? "Serving traffic" : "Health check failed"}</small>
        </article>
        <article className={`${styles.zone} ${styles.zoneStandby} ${state.phase === "standby-promoting" ? styles.zonePromoting : ""} ${state.phase === "recovered" ? styles.zoneRecovered : ""}`}>
          <span className={styles.zoneLabel}>AVAILABILITY ZONE B</span><div className={styles.triangleIcon} aria-hidden="true" /><h3>{state.phase === "recovered" ? "Active (promoted)" : "Standby"}</h3>
          <p>{state.phase === "recovered" ? "RECOVERED" : state.phase === "standby-promoting" ? `PROMOTING ${state.promotionProgress}%` : "READY"}</p>
          <small>{state.phase === "recovered" ? "Serving traffic" : state.phase === "standby-promoting" ? "Promotion in progress" : "Synchronized / no traffic"}</small>
          {state.phase === "standby-promoting" && <div className={styles.progressTrack} aria-hidden="true"><i style={{ width: `${state.promotionProgress}%` }} /></div>}
        </article>
      </div>

      <div className={styles.legend} aria-label="図の凡例"><span><i className={styles.solidLine} /> 現在の経路</span><span><i className={styles.dashedLine} /> 非選択・遮断経路</span><span><i className={styles.squareLegend} /> Active</span><span><i className={styles.triangleLegend} /> Standby</span></div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.phase !== "standby-promoting" || state.promotionProgress === 100}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.actions}><button type="button" className={styles.dangerButton} onClick={() => dispatch({ type: "inject-failure" })}>1. 障害注入</button><button type="button" onClick={() => dispatch({ type: "begin-failover" })}>2. Failover 開始</button><button type="button" className={styles.confirmButton} onClick={() => dispatch({ type: "confirm-recovery" })}>3. 復旧確認</button></div>
      </div>

      <div className={styles.explanation}>
        <div><span>WHY RELIABILITY &amp; RECOVERY?</span><p>中心となる学習対象は経路制御そのものではなく、障害判定後に待機系へ役割を引き継ぎ、サービスを復旧する一連の信頼性判断だからです。</p></div>
        <div><span>BOUNDARY CASE</span><p>障害判定前の切り替えと、昇格完了前の復旧確認は拒否されます。操作順による結果の違いをステータス欄で確認できます。</p></div>
        <div><span>SAFE SANDBOX</span><p>AZ、状態、進捗、所要時間はすべて説明用の合成データです。実クラウドへ接続せず、可用性や RTO を保証しません。</p></div>
      </div>
    </section>
  );
}

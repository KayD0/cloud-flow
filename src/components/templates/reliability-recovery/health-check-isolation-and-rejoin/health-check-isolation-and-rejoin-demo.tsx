"use client";

import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import {
  HEALTH_STAGES, healthCheckReducer, initialHealthCheckState, stageDetails, type HealthStage,
} from "@/lib/scenarios/reliability-recovery/health-check-isolation-and-rejoin/health-check-isolation-and-rejoin-scenario";
import styles from "./health-check-isolation-and-rejoin-demo.module.css";

const stageIndex = (stage: HealthStage) => HEALTH_STAGES.indexOf(stage);

export function HealthCheckIsolationAndRejoinDemo() {
  const [state, dispatch] = useReducer(healthCheckReducer, initialHealthCheckState, (initial) => healthCheckReducer(initial, { type: "start" }));
  const detail = stageDetails[state.stage];
  const currentIndex = stageIndex(state.stage);
  const checkCount = state.stage === "recovered" || state.stage === "healthy-again" ? state.recoveryChecks : state.failedChecks;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900);
    return () => window.clearInterval(timer);
  }, [state.playback]);
  useEffect(() => { if (state.stage === "isolated" && !state.recoveryRequested) dispatch({ type: "recover" }); }, [state.recoveryRequested, state.stage]);
  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="health-check-demo-title">
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE RELIABILITY SCENARIO</p><h2 id="health-check-demo-title">Health Check Isolation and Rejoin</h2><p>連続失敗の判定、経路からの隔離、回復確認後の再参加を合成 Node で追跡します。</p></div>
        <div className={styles.counter}><span>CHECK COUNT</span><strong>{checkCount}</strong><small>threshold {state.failureThreshold}</small></div>
      </div>

      <div className={styles.status} aria-live="polite"><span aria-hidden="true">{state.stage === "down" || state.stage === "isolated" ? "!" : "i"}</span><div><strong>{detail.label}</strong><p>{detail.reason}</p></div></div>

      <ol className={styles.timeline} aria-label="状態遷移">
        {HEALTH_STAGES.map((stage, index) => {
          const item = stageDetails[stage];
          const active = index === currentIndex;
          const passed = index < currentIndex || state.stage === "healthy-again";
          return <li key={stage} className={`${styles.step} ${active ? styles.active : ""} ${passed ? styles.passed : ""}`} aria-current={active ? "step" : undefined}><span className={styles.shape} aria-hidden="true">{index + 1}</span><strong>{item.label}</strong><small>{index === 3 ? "traffic removed" : index === 4 ? "2 checks" : "health state"}</small></li>;
        })}
      </ol>

      <div className={styles.diagram} aria-label="合成トラフィックと Node の接続状態">
        <div className={styles.source}><span>◆</span><strong>Synthetic traffic</strong><small>説明用リクエスト</small></div>
        <div className={`${styles.route} ${state.stage === "isolated" || state.stage === "down" ? styles.cut : ""}`}><span>{state.stage === "isolated" || state.stage === "down" ? "× ISOLATED" : "→ ROUTED"}</span></div>
        <div className={`${styles.node} ${styles[state.stage]}`}><span className={styles.nodeIcon}>N</span><strong>Node A</strong><small>{detail.label.toUpperCase()}</small></div>
      </div>

      <div className={styles.controls}>
        <div className={styles.transport} aria-label="再生操作"><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <div className={styles.settings} aria-label="シナリオ設定">
          <label><input type="checkbox" checked={state.failureInjected} onChange={(event) => dispatch({ type: "set-failure", enabled: event.target.checked })} /> 失敗を注入</label>
          <label>判定回数 <select value={state.failureThreshold} onChange={(event) => dispatch({ type: "set-threshold", threshold: Number(event.target.value) as 2 | 3 | 4 })}><option value="2">2 回</option><option value="3">3 回</option><option value="4">4 回</option></select></label>
          <button type="button" className={styles.recover} onClick={() => dispatch({ type: "recover" })} disabled={state.stage !== "isolated"}>回復させる</button>
        </div>
      </div>

      <div className={styles.legend}><span><i className={styles.solid} /> 接続中</span><span><i className={styles.dashed} /> 隔離中</span><span><b>◆</b> 合成トラフィック</span><span><b>□</b> Node</span></div>
      <div className={styles.notes}><div><span>WHY RELIABILITY &amp; RECOVERY?</span><p>中心となる判断が、障害兆候を検出して影響範囲を隔離し、安全を確認してサービスへ戻す復旧制御だからです。</p></div><div><span>NORMAL &amp; BOUNDARY</span><p>失敗注入なしでは Healthy を維持します。判定回数の直前は Warning に留まり、単発失敗で Node を隔離しません。</p></div><div><span>SAFE SANDBOX</span><p>Node、Health Check、時間、トラフィックはすべて説明用の合成値です。実環境へ作用せず、Reset で初期状態へ戻ります。</p></div></div>
    </section>
  );
}

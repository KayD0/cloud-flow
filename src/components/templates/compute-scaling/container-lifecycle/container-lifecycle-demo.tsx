"use client";

import { useEffect, useReducer } from "react";
import {
  CONTAINER_STAGES,
  containerLifecycleReducer,
  getContainerStage,
  initialContainerLifecycleState,
  lifecycleTickMilliseconds,
} from "@/lib/scenarios/compute-scaling/container-lifecycle/container-lifecycle-scenario";
import styles from "./container-lifecycle-demo.module.css";

const PLAYBACK_LABELS = { idle: "IDLE", running: "PLAYING", paused: "PAUSED" } as const;

export function ContainerLifecycleDemo() {
  const [state, dispatch] = useReducer(containerLifecycleReducer, initialContainerLifecycleState);
  const currentStage = getContainerStage(state.stage);
  const activeIndex = CONTAINER_STAGES.findIndex((stage) => stage.id === state.stage);

  useEffect(() => {
    if (state.playback !== "running" || !["starting", "processing", "restarting"].includes(state.stage)) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), lifecycleTickMilliseconds);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stage]);

  return (
    <section className={styles.demo} aria-labelledby="lifecycle-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="lifecycle-demo-title">Container Lifecycle</h2>
          <p className={styles.description}>1つの合成 Container が状態を変える様子を、製品固有の Runtime なしで観察します。</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.playback]}`} aria-live="polite">
          <span>SIMULATION</span><strong>{PLAYBACK_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <div className={styles.canvas} role="img" aria-label={`Container の現在状態は ${currentStage.label} です`}>
          <div className={styles.imageBox}><span>IMAGE</span><strong>demo-app:1.0</strong><small>synthetic</small></div>
          <div className={styles.arrow} aria-hidden="true"><span>definition</span>→</div>
          <div className={`${styles.container} ${styles[state.stage]}`}>
            <div className={styles.containerTop}><span aria-hidden="true">◇</span><strong>learning-container</strong></div>
            <div className={styles.containerBody}>
              <span className={styles.stateShape} aria-hidden="true" />
              <div><small>CURRENT STATE</small><strong>{currentStage.label}</strong></div>
            </div>
            <div className={styles.metrics}><span>Completed <b>{state.completedJobs}</b></span><span>Rejected <b>{state.rejectedJobs}</b></span></div>
          </div>
          <div className={styles.workBox}><span>WORK</span><strong>job-{String(state.completedJobs + 1).padStart(2, "0")}</strong><small>synthetic payload</small></div>
        </div>
      </div>

      <div className={styles.statePanel} aria-live="polite">
        <div><span>CURRENT STATE</span><strong>{currentStage.label}</strong></div><p>{state.message}</p>
      </div>

      <ol className={styles.timeline} aria-label="Container の状態遷移">
        {CONTAINER_STAGES.map((stage, index) => (
          <li key={stage.id} className={stage.id === state.stage ? styles.current : index < activeIndex ? styles.visited : ""} aria-current={stage.id === state.stage ? "step" : undefined}>
            <span>{index + 1}</span><small>{stage.label}</small>
          </li>
        ))}
      </ol>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "play" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.operations} aria-label="Container 操作">
          <button type="button" onClick={() => dispatch({ type: "start-container" })} disabled={state.stage !== "created" && state.stage !== "stopped"}>起動</button>
          <button type="button" onClick={() => dispatch({ type: "submit-job" })}>処理投入</button>
          <button type="button" onClick={() => dispatch({ type: "stop-container" })} disabled={state.stage === "created" || state.stage === "stopped"}>停止</button>
          <button type="button" onClick={() => dispatch({ type: "restart-container" })} disabled={state.stage === "created" || state.stage === "restarting"}>再起動</button>
        </div>
      </div>

      <div className={styles.boundaryCase}>
        <div><p>BOUNDARY CASE</p><strong>Ready 前の処理投入</strong><span>Created / Starting / Stopped などで「処理投入」すると拒否理由と件数を表示します。</span></div>
        <output aria-label="拒否された処理数">REJECTED {state.rejectedJobs}</output>
      </div>

      <aside className={styles.learningNote} aria-label="カテゴリとシナリオの説明">
        <div><strong>Why Compute &amp; Scaling?</strong><p>主題は通信経路やデータ保存ではなく、計算処理を担う Container の実行状態と、その状態に応じた操作判断だからです。</p></div>
        <div><strong>Safe learning environment</strong><p>状態、処理、所要時間はすべて説明用の合成データです。実クラウドや実サービスへ接続せず、性能、可用性、安全性を保証しません。</p></div>
      </aside>
    </section>
  );
}

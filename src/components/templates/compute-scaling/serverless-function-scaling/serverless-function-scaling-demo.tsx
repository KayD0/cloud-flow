"use client";

import { useEffect, useReducer } from "react";
import {
  getScalingSnapshot,
  getStateExplanation,
  initialServerlessScalingState,
  serverlessScalingReducer,
  type FlowPhase,
  type PlaybackSpeed,
} from "@/lib/scenarios/compute-scaling/serverless-function-scaling/serverless-function-scaling-scenario";
import styles from "./serverless-function-scaling-demo.module.css";

const phases: { key: FlowPhase; label: string; detail: string }[] = [
  { key: "invocation", label: "Invocation", detail: "synthetic calls" },
  { key: "function", label: "Cold / Warm", detail: "allocate runtime" },
  { key: "processing", label: "Processing", detail: "bounded concurrency" },
  { key: "idle", label: "Idle", detail: "ready for reuse" },
];

const playbackLabels = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;

export function ServerlessFunctionScalingDemo() {
  const [state, dispatch] = useReducer(serverlessScalingReducer, initialServerlessScalingState);
  const snapshot = getScalingSnapshot(state);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900 / state.speed);
    return () => window.clearInterval(timer);
  }, [state.playback, state.speed]);

  const visibleFunctions = state.phase === "idle"
    ? Math.min(state.completedCount, state.concurrencyLimit)
    : snapshot.activeCount;

  return (
    <section className={styles.demo} aria-labelledby="serverless-scaling-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 25</p>
          <h2 id="serverless-scaling-title">Invocation wave simulator</h2>
          <p className={styles.description}>呼び出し量と同時実行上限から、Cold Start、Warm 再利用、待機、Idle への遷移を比較します。</p>
        </div>
        <div className={`${styles.status} ${styles[state.playback]}`} aria-live="polite">
          <span>現在状態</span><strong>{playbackLabels[state.playback]}</strong>
        </div>
      </div>

      <ol className={styles.flow} aria-label="Invocation から Idle までの処理フロー">
        {phases.map((phase, index) => {
          const active = state.phase === phase.key;
          const passed = state.completedCount > 0 && (phase.key === "invocation" || phase.key === "function" || phase.key === "processing");
          return (
            <li key={phase.key} className={`${active ? styles.activeStep : ""} ${passed ? styles.passedStep : ""}`} aria-current={active ? "step" : undefined}>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
              <strong>{phase.label}</strong><small>{phase.detail}</small>
            </li>
          );
        })}
      </ol>

      <div className={styles.workspace}>
        <div className={styles.visual}>
          <div className={styles.metrics}>
            <div><span>COMPLETED</span><strong>{state.completedCount} / {state.invocationCount}</strong></div>
            <div><span>ACTIVE</span><strong>{snapshot.activeCount}</strong></div>
            <div className={snapshot.queuedCount > 0 ? styles.warningMetric : ""}><span>QUEUED</span><strong>{snapshot.queuedCount}</strong></div>
            <div><span>LIMIT</span><strong>{state.concurrencyLimit}</strong></div>
          </div>

          <div className={styles.functionPool} aria-label={`${visibleFunctions} 個の Function インスタンス`}>
            {Array.from({ length: state.concurrencyLimit }, (_, index) => {
              const occupied = index < visibleFunctions;
              const cold = occupied && index >= snapshot.warmCount && state.phase === "function" && state.batch === 0;
              const warm = occupied && !cold && (state.phase === "function" || state.phase === "processing");
              const processing = occupied && state.phase === "processing";
              const idle = occupied && state.phase === "idle";
              const label = processing ? "PROCESSING" : cold ? "COLD START" : warm ? "WARM" : idle ? "IDLE" : "AVAILABLE";
              return (
                <div key={index} className={`${styles.functionCard} ${cold ? styles.cold : ""} ${warm ? styles.warm : ""} ${processing ? styles.processing : ""} ${idle ? styles.idleFunction : ""}`}>
                  <span>ƒ</span><strong>Function {index + 1}</strong><small>{label}</small>
                </div>
              );
            })}
          </div>

          {snapshot.isConstrained && state.phase !== "ready" && state.phase !== "idle" && (
            <div className={styles.boundary} role="status"><strong>CONCURRENCY BOUNDARY</strong><span>{snapshot.queuedCount} invocation(s) waiting — no calls are lost</span></div>
          )}
        </div>

        <aside className={styles.explanation} aria-labelledby="scaling-reason-title">
          <p className={styles.panelLabel}>WHY THIS STATE?</p>
          <h3 id="scaling-reason-title">現在の判断</h3>
          <p aria-live="polite">{getStateExplanation(state)}</p>
          <dl>
            <div><dt>データ</dt><dd>合成のみ</dd></div>
            <div><dt>Cold / Warm</dt><dd>{snapshot.coldCount} / {snapshot.warmCount}</dd></div>
            <div><dt>実環境への作用</dt><dd>なし</dd></div>
          </dl>
        </aside>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.settings}>
          <label>呼び出し量 <strong>{state.invocationCount}</strong><input type="range" min="1" max="18" value={state.invocationCount} onChange={(event) => dispatch({ type: "set-invocations", count: Number(event.target.value) })} /></label>
          <label>同時実行上限 <strong>{state.concurrencyLimit}</strong><input type="range" min="1" max="6" value={state.concurrencyLimit} onChange={(event) => dispatch({ type: "set-concurrency", count: Number(event.target.value) })} /></label>
          <label>速度<select value={state.speed} onChange={(event) => dispatch({ type: "set-speed", speed: Number(event.target.value) as PlaybackSpeed })}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
        </div>
      </div>

      <footer className={styles.note}>
        <strong>なぜ Compute &amp; Scaling?</strong>
        <span>中心となる判断が、呼び出し量に応じて計算リソースの同時実行数を増減し、上限内で再利用することだからです。表示値と所要時間は説明用で、性能・可用性・安全性を保証しません。</span>
      </footer>
    </section>
  );
}

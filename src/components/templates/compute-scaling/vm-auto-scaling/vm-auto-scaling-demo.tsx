"use client";

import { useEffect, useReducer } from "react";
import { initialVmAutoScalingState, vmAutoScalingReducer } from "@/lib/scenarios/compute-scaling/vm-auto-scaling/vm-auto-scaling-scenario";
import styles from "./vm-auto-scaling-demo.module.css";

const PLAYBACK_LABEL = { idle: "READY", running: "RUNNING", paused: "PAUSED" } as const;
const STATUS_LABEL = { ready: "READY", launching: "LAUNCHING", draining: "DRAINING" } as const;

export function VmAutoScalingDemo() {
  const [state, dispatch] = useReducer(vmAutoScalingReducer, initialVmAutoScalingState);
  const readyCount = state.instances.filter((instance) => instance.status === "ready").length;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.demo} aria-labelledby="vm-scaling-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="vm-scaling-title">Load-driven VM capacity</h2>
          <p>合成した負荷を評価し、VM の追加と安全な縮退を段階ごとに追跡します。</p>
        </div>
        <div className={styles.stateBadge} data-state={state.playback}><span>CURRENT STATE</span><strong>{PLAYBACK_LABEL[state.playback]}</strong></div>
      </header>

      <div className={styles.decision} aria-live="polite">
        <span aria-hidden="true">i</span><div><strong>SCALING DECISION</strong><p>{state.decision}</p></div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.flow} aria-label="オートスケーリングの主要な状態遷移">
          <div><strong>LOAD</strong><span>負荷を監視</span></div><b aria-hidden="true">→</b>
          <div><strong>SCALE OUT</strong><span>Launching → Ready</span></div><b aria-hidden="true">/</b>
          <div><strong>SCALE IN</strong><span>Draining → Stopped</span></div>
        </div>

        <div className={styles.capacityHeader}>
          <div><span>CAPACITY POOL</span><strong>{state.instances.length} / {state.maxInstances} VMs</strong></div>
          <div><span>READY CAPACITY</span><strong>{readyCount} VMs</strong></div>
          <div><span>CURRENT LOAD</span><strong>{state.load}%</strong></div>
        </div>
        <div className={styles.instances} aria-label="VM インスタンス一覧">
          {state.instances.map((instance) => (
            <article key={instance.id} className={styles.instance} data-status={instance.status}>
              <span className={styles.vmShape} aria-hidden="true">▣</span>
              <div><strong>VM {String(instance.id).padStart(2, "0")}</strong><small>{STATUS_LABEL[instance.status]}</small></div>
            </article>
          ))}
          {Array.from({ length: Math.max(0, state.maxInstances - state.instances.length) }, (_, index) => (
            <div key={`slot-${index}`} className={styles.emptySlot}><span aria-hidden="true">＋</span><small>AVAILABLE</small></div>
          ))}
        </div>
        <p className={styles.event}><strong>LAST EVENT</strong> {state.lastEvent}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.transport} aria-label="シナリオ操作">
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.sliders}>
          <label><span>負荷 <output>{state.load}%</output></span><input aria-label="負荷" type="range" min="0" max="100" value={state.load} onChange={(event) => dispatch({ type: "set-load", value: Number(event.target.value) })} /></label>
          <label><span>最小台数 <output>{state.minInstances}</output></span><input aria-label="最小台数" type="range" min="1" max="8" value={state.minInstances} onChange={(event) => dispatch({ type: "set-min", value: Number(event.target.value) })} /></label>
          <label><span>最大台数 <output>{state.maxInstances}</output></span><input aria-label="最大台数" type="range" min="1" max="8" value={state.maxInstances} onChange={(event) => dispatch({ type: "set-max", value: Number(event.target.value) })} /></label>
          <label><span>Scale out 条件 <output>≥ {state.scaleOutThreshold}%</output></span><input aria-label="Scale out 条件" type="range" min="10" max="95" step="5" value={state.scaleOutThreshold} onChange={(event) => dispatch({ type: "set-scale-out", value: Number(event.target.value) })} /></label>
          <label><span>Scale in 条件 <output>≤ {state.scaleInThreshold}%</output></span><input aria-label="Scale in 条件" type="range" min="5" max="90" step="5" value={state.scaleInThreshold} onChange={(event) => dispatch({ type: "set-scale-in", value: Number(event.target.value) })} /></label>
        </div>
      </div>

      <footer className={styles.learningNote}>
        <strong>WHY COMPUTE &amp; SCALING?</strong>
        <p>このテンプレートの中心は通信経路ではなく、需要に応じて計算資源である VM の台数とライフサイクルを調整することです。そのため主カテゴリは Compute &amp; Scaling です。表示値と時間は学習用の合成データで、実環境への操作や性能・可用性の保証は行いません。</p>
      </footer>
    </section>
  );
}

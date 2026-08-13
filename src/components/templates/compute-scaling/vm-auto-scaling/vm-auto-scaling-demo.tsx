"use client";

import { useEffect, useReducer, type CSSProperties } from "react";
import { initialVmAutoScalingState, vmAutoScalingReducer } from "@/lib/scenarios/compute-scaling/vm-auto-scaling/vm-auto-scaling-scenario";
import styles from "./vm-auto-scaling-demo.module.css";

export function VmAutoScalingDemo() {
  const [state, dispatch] = useReducer(vmAutoScalingReducer, initialVmAutoScalingState, (initial) => vmAutoScalingReducer(initial, { type: "start" }));
  const readyCount = state.instances.filter((instance) => instance.status === "ready").length;
  const isTransitioning = state.instances.some((instance) => instance.status !== "ready");
  const enemyCount = Math.max(2, Math.round(state.load / 12));

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useEffect(() => {
    if (isTransitioning) return;
    if (state.instances.length === state.maxInstances && state.load >= state.scaleOutThreshold) {
      const timer = window.setTimeout(() => dispatch({ type: "set-load", value: 20 }), 1800);
      return () => window.clearTimeout(timer);
    }
    if (state.instances.length === state.minInstances && state.load <= state.scaleInThreshold) {
      const timer = window.setTimeout(() => dispatch({ type: "set-load", value: 85 }), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [isTransitioning, state.instances.length, state.load, state.maxInstances, state.minInstances, state.scaleInThreshold, state.scaleOutThreshold]);

  return (
    <section className={styles.demo} aria-labelledby="vm-scaling-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>TEMPLATE PREVIEW</p>
          <h2 id="vm-scaling-title">Auto Scaling Squadron</h2>
        </div>
        <div className={styles.hud} aria-label={`Load ${state.load} percent, ${readyCount} active instances`}>
          <span>THREAT <strong>{state.load}%</strong></span>
          <span>FLEET <strong>{readyCount}/{state.maxInstances}</strong></span>
        </div>
      </header>

      <div className={styles.game} data-pressure={state.load >= state.scaleOutThreshold ? "high" : "low"}>
        <div className={styles.stars} aria-hidden="true" />
        <div className={styles.threshold} style={{ left: `${state.scaleOutThreshold}%` }}>
          <span>SCALE OUT {state.scaleOutThreshold}%</span>
        </div>

        <div className={styles.enemyWave} aria-label={`${enemyCount} incoming requests`}>
          {Array.from({ length: enemyCount }, (_, index) => (
            <span key={index} className={styles.enemy} style={{ "--enemy": index } as CSSProperties} aria-hidden="true" />
          ))}
        </div>

        <div className={styles.lasers} aria-hidden="true">
          {state.instances.map((instance, index) => <i key={instance.id} style={{ "--lane": index } as CSSProperties} />)}
        </div>

        <div className={styles.squadron} aria-label={`${state.instances.length} VM fighters`}>
          {state.instances.map((instance, index) => (
            <article key={instance.id} className={styles.fighter} data-status={instance.status} style={{ "--lane": index } as CSSProperties}>
              <span className={styles.jet} aria-hidden="true"><i /><b /></span>
              <small>VM-{String(instance.id).padStart(2, "0")}</small>
            </article>
          ))}
        </div>

        <div className={styles.command}>
          <span>AUTO SCALER</span>
          <strong>{state.load >= state.scaleOutThreshold ? "REINFORCEMENTS DEPLOYING" : state.load <= state.scaleInThreshold ? "SQUADRON CONSOLIDATING" : "CAPACITY HOLDING"}</strong>
        </div>
      </div>

      <div className={styles.readout}>
        <div><span>INCOMING LOAD</span><strong>{state.load}%</strong><i><b style={{ width: `${state.load}%` }} /></i></div>
        <div><span>ACTIVE FIGHTERS</span><strong>{readyCount}</strong></div>
        <div><span>AUTO SCALE RANGE</span><strong>{state.minInstances}–{state.maxInstances}</strong></div>
      </div>
    </section>
  );
}

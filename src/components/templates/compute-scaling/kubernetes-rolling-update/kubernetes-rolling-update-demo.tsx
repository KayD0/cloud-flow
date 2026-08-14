"use client";

import { useEffect, useReducer, useState } from "react";
import { initialRollingUpdateState, rollingUpdateReducer, type RollingUpdateStage } from "@/lib/scenarios/compute-scaling/kubernetes-rolling-update/kubernetes-rolling-update-scenario";
import styles from "./kubernetes-rolling-update-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const STAGES: RollingUpdateStage[] = ["current", "new-replica-set", "pod-replacement", "old-retired"];
const STAGE_LABELS: Record<RollingUpdateStage, string> = {
  current: "CURRENT REPLICASET",
  "new-replica-set": "NEW REPLICASET",
  "pod-replacement": "POD REPLACEMENT",
  "old-retired": "OLD RETIRED",
};
const SPEEDS = { slow: { label: "Slow", interval: 1500 }, normal: { label: "Normal", interval: 900 }, fast: { label: "Fast", interval: 450 } } as const;
type Speed = keyof typeof SPEEDS;

export function KubernetesRollingUpdateDemo() {
  const [state, dispatch] = useReducer(rollingUpdateReducer, initialRollingUpdateState, (initial) => rollingUpdateReducer(initial, { type: "start" }));
  const [speed, setSpeed] = useState<Speed>("normal");
  const totalReady = state.oldReady + state.newReady;
  const explanation = state.playback === "idle"
    ? `Current ReplicaSetの${state.replicas} Podを維持したまま、更新を開始できます。`
    : state.playback === "paused"
      ? `置換を一時停止中です。Ready ${totalReady} Podの現在状態を保っています。`
      : state.playback === "completed"
        ? `New ReplicaSetの${state.newReady} PodがReadyになり、旧世代はすべてretiredになりました。`
        : state.stage === "new-replica-set"
          ? "新PodのReadinessを確認しました。次に対応する旧Podをdrainingします。"
          : `新Podを確認済みの旧Podだけをdrainingしています（${state.oldRetired}/${state.replicas}置換済み）。`;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), SPEEDS[speed].interval);
    return () => window.clearInterval(timer);
  }, [speed, state.playback]);

  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="rolling-update-title">
      <div className={styles.demoHeader}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 14</p><h2 id="rolling-update-title">Kubernetes Rolling Update</h2><p className={styles.description}>Current ReplicaSet → New ReplicaSet → Pod replacement → Old retired を段階的に追跡します。</p></div>
        <div className={styles.stateBadge} data-state={state.playback}><span>CURRENT STATE</span><strong>{state.playback === "paused" ? "PAUSED" : STAGE_LABELS[state.stage]}</strong></div>
      </div>
      <div className={styles.statusPanel} aria-live="polite"><strong>{STAGE_LABELS[state.stage]}</strong><span>{explanation}</span></div>
      <ol className={styles.flow} aria-label="Rolling Updateの状態遷移">
        {STAGES.map((stage, index) => <li key={stage} data-active={stage === state.stage} data-visited={index < STAGES.indexOf(state.stage)}><span>{index + 1}</span>{STAGE_LABELS[stage]}</li>)}
      </ol>
      <div className={styles.canvas}>
        <ReplicaSet title="Current ReplicaSet" version="v1 · OLD" tone="old" ready={state.oldReady} retired={state.oldRetired} total={state.replicas} />
        <div className={styles.replacementArrow} aria-hidden="true"><span>READY CHECK</span><strong>→</strong><span>DRAIN</span></div>
        <ReplicaSet title="New ReplicaSet" version="v2 · NEW" tone="new" ready={state.newReady} retired={0} total={state.replicas} />
      </div>
      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => { dispatch({ type: "reset" }); setSpeed("normal"); }}>↺ Reset</button>
        </div>
        <label><span>Replica count <output>{state.replicas}</output></span><input aria-label="Replica数" type="range" min="1" max="8" value={state.replicas} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-replicas", replicas: Number(event.target.value) })} /></label>
        <label><span>Update speed <output>{SPEEDS[speed].label}</output></span><select aria-label="更新速度" value={speed} onChange={(event) => setSpeed(event.target.value as Speed)}>{Object.entries(SPEEDS).map(([value, setting]) => <option key={value} value={value}>{setting.label}</option>)}</select></label>
      </div>
      <div className={styles.results}>
        <div><span>REPLACED</span><strong>{state.oldRetired} / {state.replicas}</strong></div><div><span>READY PODS</span><strong>{totalReady}</strong></div><div><span>OLD RETIRED</span><strong>{state.oldRetired}</strong></div>
        <p><strong>Why Compute &amp; Scaling?</strong> 実行単位であるPodの世代とReplica数を、稼働数を保ちながら増減させることが中心課題だからです。Replica 1では一時的に2 Podとなり、Ready確認後に旧Podを退役させます。値と時間は説明用で、実環境には作用しません。</p>
      </div>
    </section>
  );
}

function ReplicaSet({ title, version, tone, ready, retired, total }: { title: string; version: string; tone: "old" | "new"; ready: number; retired: number; total: number }) {
  return <section className={styles.replicaSet} data-tone={tone} aria-label={`${title}: Ready ${ready}, Retired ${retired}`}><header><div><span>{version}</span><h3>{title}</h3></div><strong>{ready} READY</strong></header><div className={styles.pods}>{Array.from({ length: total }, (_, index) => {
    const status = tone === "old" && index >= total - retired ? "retired" : index < ready ? "ready" : "pending";
    return <div key={index} className={styles.pod} data-status={status}><span>{status === "retired" ? "×" : status === "ready" ? "●" : "+"}</span><strong>Pod {index + 1}</strong><small>{status.toUpperCase()}</small></div>;
  })}</div></section>;
}

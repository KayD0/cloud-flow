"use client";

import { useEffect, useReducer } from "react";
import { initialKubernetesPodSchedulingState, kubernetesPodSchedulingReducer, phaseLabels, type PodPhase } from "@/lib/scenarios/compute-scaling/kubernetes-pod-scheduling/kubernetes-pod-scheduling-scenario";
import styles from "./kubernetes-pod-scheduling-demo.module.css";

const playbackLabels = { idle: "READY", running: "SCHEDULING", paused: "PAUSED", completed: "COMPLETED", blocked: "UNSCHEDULABLE" } as const;
const phases: PodPhase[] = ["pending", "scheduler", "selected", "starting", "ready"];

export function KubernetesPodSchedulingDemo() {
  const [state, dispatch] = useReducer(kubernetesPodSchedulingReducer, initialKubernetesPodSchedulingState);
  const readyPods = state.pods.filter((pod) => pod.phase === "ready");
  const nodePods = state.pods.filter((pod) => ["selected", "starting", "ready"].includes(pod.phase));
  const currentPod = state.pods.find((pod) => pod.id === state.activePodId) ?? state.pods.find((pod) => pod.phase === "pending");

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.demo} aria-labelledby="scheduling-demo-title">
      <div className={styles.demoHeader}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p><h2 id="scheduling-demo-title">Kubernetes Pod Scheduling</h2><p className={styles.description}>未配置 Pod が Node を選ばれ、起動して処理可能になるまでの判断を追跡します。</p></div>
        <div className={styles.stateBadge} data-state={state.playback}><span>CURRENT STATE</span><strong>{playbackLabels[state.playback]}</strong></div>
      </div>
      <div className={styles.statusPanel} aria-live="polite"><span className={styles.statusIcon} aria-hidden="true">{state.playback === "blocked" ? "!" : "i"}</span><div><strong>{playbackLabels[state.playback]}</strong><p>{state.decision}</p></div></div>

      <div className={styles.flow} aria-label="Pod の状態遷移">
        {phases.map((phase, index) => <div className={styles.stepWrap} key={phase}><div className={`${styles.step} ${currentPod?.phase === phase ? styles.activeStep : ""}`}><span>{index + 1}</span><strong>{phaseLabels[phase]}</strong></div>{index < phases.length - 1 && <i aria-hidden="true">→</i>}</div>)}
      </div>

      <div className={styles.workspace}>
        <section className={styles.queue} aria-labelledby="queue-title">
          <div className={styles.panelTitle}><div><span>QUEUE</span><h3 id="queue-title">Pending Pods</h3></div><strong>{state.pods.filter((pod) => pod.phase === "pending").length}</strong></div>
          <div className={styles.podList}>{state.pods.filter((pod) => pod.phase === "pending" || pod.phase === "scheduler").map((pod) => <div className={styles.pod} data-phase={pod.phase} key={pod.id}><span className={styles.podShape} aria-hidden="true" /><div><strong>{pod.name}</strong><small>{phaseLabels[pod.phase]}</small></div></div>)}{!state.pods.some((pod) => pod.phase === "pending" || pod.phase === "scheduler") && <p className={styles.empty}>Pending Pod はありません</p>}</div>
        </section>
        <section className={styles.scheduler} aria-labelledby="scheduler-title"><span className={styles.schedulerMark} aria-hidden="true">S</span><h3 id="scheduler-title">Scheduler</h3><p>空き容量を確認し、配置先を決定</p></section>
        <section className={styles.node} aria-labelledby="node-title">
          <div className={styles.panelTitle}><div><span>COMPUTE</span><h3 id="node-title">Node A</h3></div><strong>{nodePods.length}/{state.nodeCapacity}</strong></div>
          <div className={styles.capacityBar} aria-label={`Node 使用量 ${nodePods.length}/${state.nodeCapacity}`}><span style={{ width: `${Math.min(100, nodePods.length / state.nodeCapacity * 100)}%` }} /></div>
          <div className={styles.podGrid}>{nodePods.map((pod) => <div className={styles.pod} data-phase={pod.phase} key={pod.id}><span className={styles.podShape} aria-hidden="true" /><div><strong>{pod.name}</strong><small>{phaseLabels[pod.phase]}</small></div>{pod.phase === "ready" && <button type="button" onClick={() => dispatch({ type: "reschedule", podId: pod.id })}>再配置</button>}</div>)}</div>
        </section>
      </div>

      <div className={styles.legend} aria-label="状態の凡例"><span><i className={styles.pendingKey} /> Pending / 評価中</span><span><i className={styles.startingKey} /> Starting</span><span><i className={styles.readyKey} /> Ready</span><span><i className={styles.blockedKey} /> 容量不足</span></div>
      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <button type="button" onClick={() => dispatch({ type: "add-pod" })}>＋ Pod 追加</button>
        <label><span>Node 容量 <output>{state.nodeCapacity}</output></span><input aria-label="Node 容量" type="range" min="1" max="6" value={state.nodeCapacity} onChange={(event) => dispatch({ type: "set-capacity", capacity: Number(event.target.value) })} /></label>
      </div>
      <div className={styles.results}><div><span>TOTAL PODS</span><strong>{state.pods.length}</strong></div><div><span>READY</span><strong>{readyPods.length}</strong></div><div><span>AVAILABLE SLOTS</span><strong>{Math.max(0, state.nodeCapacity - nodePods.length)}</strong></div></div>
      <div className={styles.explanation}><div><span>WHY COMPUTE &amp; SCALING?</span><p>学習の中心が通信経路ではなく、計算資源の容量に応じてワークロードの配置と処理可能数が変わる仕組みだからです。</p></div><div><span>SAFE SANDBOX</span><p>Pod、Node、時間はすべて説明用の合成状態です。実 Kubernetes API やクラウド環境には接続しません。</p></div></div>
    </section>
  );
}

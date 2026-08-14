"use client";

import { useEffect, useReducer, useState, type CSSProperties } from "react";
import { initialKubernetesPodSchedulingState, kubernetesPodSchedulingReducer, unitMeta, type UnitType } from "@/lib/scenarios/compute-scaling/kubernetes-pod-scheduling/kubernetes-pod-scheduling-scenario";
import styles from "./kubernetes-pod-scheduling-demo.module.css";

const unitGlyph: Record<UnitType, string> = { fighter: "✈", tank: "▰", marine: "▲", gunner: "⌖" };
type EnemyUnit = { id: number; unit: "fighter" | "ground"; status: "ready" | "destroyed" | "deploying" };
const initialEnemies: EnemyUnit[] = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, unit: index < 2 ? "fighter" : "ground", status: "ready" }));

export function KubernetesPodSchedulingDemo() {
  const [state, dispatch] = useReducer(kubernetesPodSchedulingReducer, initialKubernetesPodSchedulingState);
  const [battlePhase, setBattlePhase] = useState<"idle" | "incoming" | "impact" | "recovering">("idle");
  const [enemyUnits, setEnemyUnits] = useState<EnemyUnit[]>(initialEnemies);
  const readyPods = state.pods.filter((pod) => pod.status === "ready");
  const missing = state.desiredReplicas - readyPods.length;
  const cpu = readyPods.reduce((sum, pod) => sum + unitMeta[pod.unit].cpu, 0);
  const memory = readyPods.reduce((sum, pod) => sum + unitMeta[pod.unit].memory, 0);
  const deployingPods = state.pods.filter((pod) => pod.status === "deploying");

  useEffect(() => {
    if (battlePhase !== "idle" || !readyPods.length) return;
    const timer = window.setTimeout(() => setBattlePhase("incoming"), 2200);
    return () => window.clearTimeout(timer);
  }, [battlePhase, readyPods.length]);

  useEffect(() => {
    if (battlePhase !== "incoming") return;
    const timer = window.setTimeout(() => {
      const victim = readyPods[Math.floor(Math.random() * readyPods.length)];
      const readyEnemies = enemyUnits.filter((unit) => unit.status === "ready");
      const enemyVictim = readyEnemies[Math.floor(Math.random() * readyEnemies.length)];
      dispatch({ type: "enemy-wave", victimId: victim?.id });
      setEnemyUnits((units) => units.map((unit) => unit.id === enemyVictim?.id ? { ...unit, status: "destroyed" } : unit));
      setBattlePhase("impact");
    }, 5700);
    return () => window.clearTimeout(timer);
  }, [battlePhase, readyPods, enemyUnits]);

  useEffect(() => {
    if (battlePhase !== "impact") return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "reconcile" });
      setEnemyUnits((units) => {
        const destroyed = units.find((unit) => unit.status === "destroyed");
        if (!destroyed) return units;
        const nextId = Math.max(...units.map((unit) => unit.id)) + 1;
        return [...units, { id: nextId, unit: destroyed.unit, status: "deploying" }];
      });
      setBattlePhase("recovering");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [battlePhase]);

  useEffect(() => {
    if (!deployingPods.length) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "complete-deployment" });
      setEnemyUnits((units) => units.filter((unit) => unit.status !== "destroyed").map((unit) => unit.status === "deploying" ? { ...unit, status: "ready" } : unit));
      setBattlePhase("idle");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [deployingPods.length]);

  return (
    <section className={styles.demo} aria-labelledby="battle-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>KUBERNETES DEFENSE SIMULATOR</p><h2 id="battle-title">Cluster Defense Command</h2></div>
        <div className={styles.clusterHealth} data-health={missing ? "warning" : "healthy"}><span>CLUSTER STATUS</span><strong>{missing ? `DEGRADED −${missing}` : "HEALTHY"}</strong></div>
      </header>

      <div className={styles.commandBar}>
        <div><span>DESIRED STATE</span><strong>{state.desiredReplicas} Pods</strong></div>
        <div><span>CURRENT / READY</span><strong>{readyPods.length} / {state.desiredReplicas}</strong></div>
        <div><span>CPU REQUEST</span><strong>{cpu}m</strong></div>
        <div><span>MEMORY</span><strong>{memory} Mi</strong></div>
        <div><span>ENEMY WAVE</span><strong>#{String(state.wave).padStart(2, "0")}</strong></div>
      </div>

      <div className={styles.battlefield} data-phase={battlePhase} aria-label="空と陸の2D戦場">
        <div className={styles.sky}><span>AIR NODE</span><i /><i /><i /></div>
        <div className={styles.mountains} aria-hidden="true" />
        <div className={styles.ground}><span>GROUND NODE</span></div>
        <div className={styles.playerBase} aria-label="自軍基地 Node"><i>CF</i><strong>CONTROL<br />PLANE</strong><small>AUTO</small></div>
        <div className={styles.enemyBase} aria-label="敵基地"><i>!</i><strong>ENEMY<br />BASE</strong></div>
        <div className={styles.frontLine} aria-hidden="true"><span>FRONT LINE</span></div>
        <div className={styles.units}>
          {state.pods.map((pod, index) => {
            const unitSlot = state.pods.slice(0, index).filter((candidate) => candidate.unit === pod.unit && candidate.status !== "destroyed").length;
            return <article key={pod.id} className={styles.battleUnit} data-unit={pod.unit} data-status={pod.status} style={{ "--slot": index % 4, "--unit-slot": unitSlot } as CSSProperties} aria-label={`${unitMeta[pod.unit].label} Pod ${pod.id} ${pod.status}`}>
            <span aria-hidden="true">{unitGlyph[pod.unit]}</span><b>{unitMeta[pod.unit].label}</b><small>Pod-{pod.id}</small><i />
          </article>;})}
        </div>
        <div className={styles.enemies} aria-hidden="true">{enemyUnits.map((unit, index) => {
          const unitSlot = enemyUnits.slice(0, index).filter((candidate) => candidate.unit === unit.unit && candidate.status !== "destroyed").length;
          return <i key={unit.id} data-unit={unit.unit} data-status={unit.status} style={{ "--enemy": index, "--unit-slot": unitSlot } as CSSProperties}><b>{unit.unit === "fighter" ? "✈" : "◆"}</b></i>;
        })}</div>
        <div className={styles.shell} aria-hidden="true" />
        <div className={styles.explosion} aria-hidden="true"><i /><i /><i /></div>
        <aside className={styles.controller} aria-label="ReplicaSet controller"><span>REPLICASET</span><strong>{battlePhase === "recovering" ? "Podを再生成中…" : missing ? `${missing} Pod不足` : "Desired 8 / Ready 8"}</strong><i data-active={state.selfHealing} /></aside>
      </div>

      <div className={styles.console}>
        <section className={styles.controls} aria-labelledby="operations-title"><span>AUTONOMOUS DEFENSE</span><h3 id="operations-title">常時自動迎撃</h3>
          <p className={styles.operationStatus} data-phase={battlePhase} aria-live="polite">{battlePhase === "incoming" ? "両軍が中央戦線へ進軍中…" : battlePhase === "impact" ? "中央地帯で交戦中" : battlePhase === "recovering" ? "両軍が大破した部隊を補充中…" : "索敵中 — 次の敵襲を待機"}</p>
          <div className={styles.forceSummary}><span>飛行機 <b>2</b></span><span>陸上戦車 <b>4</b></span><span>タワー砲手 <b>2</b></span></div>
        </section>
        <section className={styles.events} aria-labelledby="events-title"><div><span>CLUSTER EVENTS</span><h3 id="events-title">Event Log</h3></div><ol aria-live="polite">{[...state.events].reverse().map((event) => <li key={event.id} data-tone={event.tone}><time>{String(event.id).padStart(2, "0")}</time><p>{event.message}</p></li>)}</ol></section>
      </div>
      <footer className={styles.legend}><span><i>Cluster</i> 戦場全体</span><span><i>Node</i> 配置エリア</span><span><i>Pod</i> 戦闘部隊</span><span><i>Deployment</i> 編成命令</span></footer>
    </section>
  );
}

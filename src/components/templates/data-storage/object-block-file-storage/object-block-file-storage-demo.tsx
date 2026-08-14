"use client";

import { useEffect, useReducer } from "react";
import {
  getStorageDetail, getStorageExplanation, initialStorageScenarioState, storageScenarioReducer, STORAGE_TYPES,
  type AccessActor, type StorageOperation, type StorageType,
} from "@/lib/scenarios/data-storage/object-block-file-storage/object-block-file-storage-scenario";
import styles from "./object-block-file-storage-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const STORAGE_LABELS: Record<StorageType, string> = { object: "Object", block: "Block", file: "File" };
const OUTCOME_LABELS = { waiting: "READY", saved: "SAVED", retrieved: "RETRIEVED", blocked: "ACCESS BLOCKED" } as const;

export function ObjectBlockFileStorageDemo() {
  const [state, dispatch] = useReducer(storageScenarioReducer, initialStorageScenarioState, (initial) => storageScenarioReducer(initial, { type: "start" }));
  const detail = getStorageDetail(state.storageType);
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 800);
    return () => window.clearInterval(timer);
  }, [state.playback]);
  const actorLabel = state.actor === "application" ? "Application" : "VM";
  const operationLabel = state.operation === "write" ? "Save" : "Retrieve";

  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="storage-demo-title">
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 29</p><h2 id="storage-demo-title">Storage access path</h2>
          <p className={styles.description}>同じ合成データでも、保存方式によってアクセス単位と利用経路がどう変わるかを追跡します。</p></div>
        <div className={`${styles.outcome} ${styles[state.outcome]}`} aria-live="polite"><span>現在状態</span><strong>{state.playback === "paused" ? "PAUSED" : OUTCOME_LABELS[state.outcome]}</strong></div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.diagram} aria-label={`${actorLabel} から ${STORAGE_LABELS[state.storageType]} Storage を経由して ${operationLabel} する流れ`}>
          <FlowNode active={state.step >= 1} kind="ACCESS ACTOR" title={actorLabel} detail={state.actor === "application" ? "direct request" : "compute instance"} />
          <Connector active={state.step >= 1} label={detail.route} />
          <div className={`${styles.node} ${styles.storage} ${state.step >= 2 ? styles.active : ""}`} data-storage={state.storageType}>
            <span className={styles.kind}>STORAGE TYPE</span><strong>{STORAGE_LABELS[state.storageType]}</strong><small>unit: {detail.unit}</small>
          </div>
          <Connector active={state.step >= 2} label={state.operation.toUpperCase()} />
          <div className={`${styles.node} ${state.step === 3 ? styles.active : ""} ${state.outcome === "blocked" ? styles.blockedNode : ""}`}>
            <span className={styles.kind}>RESULT</span><strong>{state.outcome === "blocked" ? "Blocked" : operationLabel}</strong><small>{state.operation === "write" ? "sample-record-029" : "return synthetic data"}</small>
          </div>
          {state.playback === "running" && <span className={`${styles.packet} ${styles[`step${state.step}`]}`} aria-hidden="true">◆</span>}
        </div>
        <aside className={styles.explanation} aria-labelledby="storage-explanation-title">
          <p className={styles.panelLabel}>WHY THIS RESULT?</p><h3 id="storage-explanation-title">判断理由</h3>
          <p aria-live="polite">{getStorageExplanation(state)}</p>
          <dl><div><dt>アクセス単位</dt><dd>{detail.unit}</dd></div><div><dt>利用経路</dt><dd>{detail.route}</dd></div><div><dt>実環境への作用</dt><dd>なし（合成データ）</dd></div></dl>
        </aside>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <OptionGroup label="保存方式" values={STORAGE_TYPES} selected={state.storageType} labels={STORAGE_LABELS} onSelect={(storageType) => dispatch({ type: "set-storage", storageType })} />
        <OptionGroup label="操作" values={["write", "read"] as const} selected={state.operation} labels={{ write: "Write / Save", read: "Read / Retrieve" }} onSelect={(operation: StorageOperation) => dispatch({ type: "set-operation", operation })} />
        <OptionGroup label="アクセス主体" values={["application", "vm"] as const} selected={state.actor} labels={{ application: "Application", vm: "VM" }} onSelect={(actor: AccessActor) => dispatch({ type: "set-actor", actor })} />
      </div>

      <footer className={styles.note}><strong>なぜ Data &amp; Storage?</strong><span>中心となる判断が計算処理やネットワーク経路ではなく、データをどの単位で保存し、どのインターフェースで読み書きするかだからです。表示値と時間は説明用で、性能・可用性・安全性を保証しません。</span></footer>
    </section>
  );
}

function FlowNode({ active, kind, title, detail }: { active: boolean; kind: string; title: string; detail: string }) {
  return <div className={`${styles.node} ${active ? styles.active : ""}`}><span className={styles.kind}>{kind}</span><strong>{title}</strong><small>{detail}</small></div>;
}

function Connector({ active, label }: { active: boolean; label: string }) {
  return <div className={`${styles.connector} ${active ? styles.activeLine : ""}`}><span>{label}</span></div>;
}

function OptionGroup<T extends string>({ label, values, selected, labels, onSelect }: { label: string; values: readonly T[]; selected: T; labels: Record<T, string>; onSelect: (value: T) => void }) {
  return <fieldset className={styles.optionGroup}><legend>{label}</legend><div>{values.map((value) => <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)}>{labels[value]}</button>)}</div></fieldset>;
}

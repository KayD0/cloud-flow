"use client";

import { useEffect, useReducer } from "react";
import {
  DATA_ITEMS,
  databaseReadWriteReducer,
  delayMilliseconds,
  getStages,
  initialDatabaseReadWriteState,
} from "@/lib/scenarios/data-storage/database-read-write/database-read-write-scenario";
import styles from "./database-read-write-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const PLAYBACK_LABELS = {
  idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED", "not-found": "NOT FOUND",
} as const;

export function DatabaseReadWriteDemo() {
  const [state, dispatch] = useReducer(databaseReadWriteReducer, initialDatabaseReadWriteState, (initial) => databaseReadWriteReducer(initial, { type: "start" }));
  const stages = getStages(state.operation);
  const stage = stages[state.stageIndex];
  const terminal = state.playback === "completed" || state.playback === "not-found";
  const selectionLocked = state.playback !== "idle";
  const tokenProgress = (state.stageIndex / (stages.length - 1)) * 100;
  const tokenPosition = state.operation === "write" ? tokenProgress : 100 - tokenProgress;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), delayMilliseconds[state.delayMode]);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stageIndex, state.delayMode]);

  const detail = state.playback === "not-found" ? state.result : stage.detail;

  useTemplateLoop(terminal, () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="database-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="database-demo-title">Application ↔ Database</h2>
          <p className={styles.description}>Write は右向きの実線、Read は左向きの破線で、データの向きと結果を段階的に確認できます。</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.playback]}`} aria-live="polite">
          <span>CURRENT STATE</span><strong>{PLAYBACK_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.canvas} role="img" aria-label={`Application と Database の間の ${state.operation === "write" ? "Write" : "Read"} フロー`}>
        <div className={styles.node}><span>APP</span><strong>Application</strong><small>{state.operation === "write" ? "DATA SOURCE" : "DATA CONSUMER"}</small></div>
        <div className={styles.flow}>
          <div className={`${styles.writeLane} ${state.operation === "write" ? styles.activeLane : ""}`}><span>WRITE · SAVE</span><i aria-hidden="true">→</i></div>
          <div className={`${styles.readLane} ${state.operation === "read" ? styles.activeLane : ""}`}><i aria-hidden="true">←</i><span>READ · FETCH</span></div>
          <div className={styles.tokenTrack} aria-hidden="true"><b style={{ left: `${tokenPosition}%` }}>{state.operation === "write" ? "W" : "R"}</b></div>
        </div>
        <div className={`${styles.node} ${styles.database}`}><span>DB</span><strong>Database</strong><small>{state.playback === "not-found" ? "KEY NOT FOUND" : `${Object.keys(state.records).length} RECORD(S)`}</small></div>
      </div>

      <div className={styles.statePanel} aria-live="polite">
        <div><span>STEP {state.stageIndex + 1} / {stages.length}</span><strong>{state.playback === "not-found" ? "Boundary: Not found" : stage.label}</strong></div>
        <p>{detail}</p>
        {state.result && <output><span>RESULT</span>{state.result}</output>}
      </div>

      <ol className={styles.timeline} aria-label="状態遷移">
        {stages.map((item, index) => (
          <li key={item.id} className={index === state.stageIndex ? styles.current : index < state.stageIndex ? styles.visited : ""} aria-current={index === state.stageIndex ? "step" : undefined}>
            <span>{index + 1}</span><small>{item.label}</small>
          </li>
        ))}
      </ol>

      <div className={styles.controls}>
        <div className={styles.transport} aria-label="再生操作">
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || terminal}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "step" })} disabled={terminal}>▷ Step</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.settings}>
          <fieldset disabled={selectionLocked}>
            <legend>Operation</legend>
            <label><input type="radio" name="operation" checked={state.operation === "write"} onChange={() => dispatch({ type: "set-operation", operation: "write" })} /> Write</label>
            <label><input type="radio" name="operation" checked={state.operation === "read"} onChange={() => dispatch({ type: "set-operation", operation: "read" })} /> Read</label>
          </fieldset>
          <label className={styles.selectLabel}>Data item
            <select value={state.dataKey} disabled={selectionLocked} onChange={(event) => dispatch({ type: "set-data-key", dataKey: event.target.value as typeof state.dataKey })}>
              {DATA_ITEMS.map((item) => <option key={item.key} value={item.key}>{item.label}{item.value === null ? " (boundary)" : ""}</option>)}
            </select>
          </label>
          <fieldset disabled={state.playback === "running" || terminal}>
            <legend>Delay</legend>
            <label><input type="radio" name="delay" checked={state.delayMode === "normal"} onChange={() => dispatch({ type: "set-delay", delayMode: "normal" })} /> 800 ms</label>
            <label><input type="radio" name="delay" checked={state.delayMode === "slow"} onChange={() => dispatch({ type: "set-delay", delayMode: "slow" })} /> 1,600 ms</label>
          </fieldset>
        </div>
      </div>

      <div className={styles.boundaryCase}>
        <div><p>BOUNDARY CASE</p><strong>Missing key</strong><span>Read で未登録キーを選ぶと、値を捏造せず Not found として終了します。</span></div>
        <code>records[&quot;missing&quot;] → undefined</code>
      </div>

      <aside className={styles.learningNote} aria-label="カテゴリと安全性の説明">
        <div><strong>Why Data &amp; Storage?</strong><p>主題は通信経路ではなく、データを永続化する Write と、保存済みデータを取り出す Read の役割と結果の違いだからです。</p></div>
        <div><strong>Safe learning environment</strong><p>すべてブラウザ内の合成データです。実 Database や SQL、クラウドサービスへ接続せず、表示時間は性能を保証しません。</p></div>
      </aside>
    </section>
  );
}

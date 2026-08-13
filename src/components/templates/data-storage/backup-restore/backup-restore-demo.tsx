"use client";

import { useEffect, useReducer } from "react";
import {
  backupRestoreReducer,
  getBackupRestoreExplanation,
  getSelectedGeneration,
  initialBackupRestoreState,
} from "@/lib/scenarios/data-storage/backup-restore/backup-restore-scenario";
import styles from "./backup-restore-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const phaseLabels = {
  idle: "READY",
  running: "IN PROGRESS",
  paused: "PAUSED",
  completed: "COMPLETED",
  failed: "VALIDATION FAILED",
} as const;

export function BackupRestoreDemo() {
  const [state, dispatch] = useReducer(backupRestoreReducer, initialBackupRestoreState, (initial) => backupRestoreReducer(initial, { type: "start-restore" }));
  const selected = getSelectedGeneration(state);

  useEffect(() => {
    if (state.phase !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 850);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  const backupActive = state.operation === "backup" && state.phase !== "idle";
  const restoreActive = state.operation === "restore" && state.phase !== "idle";

  useTemplateLoop(state.phase === "completed" || state.phase === "failed", () => { dispatch({ type: "reset" }); dispatch({ type: "start-restore" }); });

  return (
    <section className={styles.demo} aria-labelledby="backup-restore-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 30 · SYNTHETIC DATA</p>
          <h2 id="backup-restore-title">Generation backup and selective restore</h2>
          <p className={styles.description}>世代を作成し、選択した時点の合成データを検証して復元する判断過程を追跡します。</p>
        </div>
        <div className={`${styles.status} ${styles[state.phase]}`} aria-live="polite">
          <span>現在状態</span><strong>{phaseLabels[state.phase]}</strong>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.diagram} aria-label="Primary Store から Backup generation、Backup Store、Restore target への流れ">
          <article className={`${styles.node} ${backupActive && state.step >= 0 ? styles.active : ""}`}>
            <span className={styles.kind}>SOURCE · LIVE</span><strong>Primary Store</strong><small>1,312 synthetic records</small>
          </article>
          <div className={`${styles.connector} ${backupActive && state.step >= 1 ? styles.backupLine : ""}`}><span>SNAPSHOT</span></div>
          <article className={`${styles.node} ${styles.generation} ${(backupActive && state.step >= 1) || restoreActive ? styles.active : ""}`}>
            <span className={styles.kind}>POINT IN TIME</span><strong>Backup generation</strong><small>{selected.label}</small>
          </article>
          <div className={`${styles.connector} ${backupActive && state.step >= 2 ? styles.backupLine : ""}`}><span>WRITE</span></div>
          <article className={`${styles.node} ${(backupActive && state.step >= 2) || (restoreActive && state.step >= 1) ? styles.active : ""}`}>
            <span className={styles.kind}>VERSIONED · ISOLATED</span><strong>Backup Store</strong><small>{state.generations.length} retained generations</small>
          </article>
          <div className={`${styles.connector} ${restoreActive && state.step >= 2 ? styles.restoreLine : ""} ${state.phase === "failed" ? styles.failedLine : ""}`}><span>VALIDATE / RESTORE</span></div>
          <article className={`${styles.node} ${styles.target} ${restoreActive && state.step >= 2 ? styles.active : ""} ${state.phase === "failed" ? styles.failedNode : ""}`}>
            <span className={styles.kind}>NON-PRODUCTION</span><strong>Restore target</strong><small>{state.restoreTarget}</small>
          </article>
          {state.phase === "running" && <span className={`${styles.marker} ${styles[`step${state.step}`]}`} aria-hidden="true">◆</span>}
        </div>

        <aside className={styles.sidePanel} aria-labelledby="generation-title">
          <p className={styles.panelLabel}>BACKUP STORE</p>
          <h3 id="generation-title">Restore 世代を選択</h3>
          <div className={styles.generations}>
            {state.generations.map((generation) => (
              <button
                type="button"
                key={generation.id}
                aria-pressed={generation.id === state.selectedGenerationId}
                onClick={() => dispatch({ type: "select-generation", id: generation.id })}
                disabled={state.phase === "running"}
              >
                <span><strong>{generation.label}</strong><small>{generation.recordCount} records</small></span>
                <em className={generation.health === "corrupt" ? styles.corrupt : styles.available}>
                  {generation.health === "corrupt" ? "⚠ CORRUPT" : "✓ AVAILABLE"}
                </em>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className={styles.explanation}>
        <div><p className={styles.panelLabel}>WHAT IS HAPPENING?</p><p aria-live="polite">{getBackupRestoreExplanation(state)}</p></div>
        <dl>
          <div><dt>操作</dt><dd>{state.operation === "backup" ? "Backup 作成" : "Restore"}</dd></div>
          <div><dt>選択世代</dt><dd>{selected.id.toUpperCase()}</dd></div>
          <div><dt>実環境への作用</dt><dd>なし（合成データ）</dd></div>
        </dl>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.primaryActions}>
          <button type="button" onClick={() => dispatch({ type: "create-backup" })} disabled={state.phase === "running"}>＋ Create backup</button>
          <button type="button" onClick={() => dispatch({ type: "start-restore" })} disabled={state.phase === "running"}>▶ Start restore</button>
        </div>
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.phase !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
      </div>

      <footer className={styles.note}>
        <strong>なぜ Data &amp; Storage?</strong>
        <span>中心となる判断対象が通信や切り替えではなく、データの世代化・保管・選択復元だからです。表示値と所要時間は説明用で、性能・可用性・安全性を保証しません。</span>
      </footer>
    </section>
  );
}

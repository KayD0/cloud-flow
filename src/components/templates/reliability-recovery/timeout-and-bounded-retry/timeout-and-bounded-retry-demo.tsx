"use client";

import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import {
  backoffMs,
  effectiveDelayMs,
  initialTimeoutAndBoundedRetryState,
  timeoutAndBoundedRetryReducer,
  type RetryPhase,
} from "@/lib/scenarios/reliability-recovery/timeout-and-bounded-retry/timeout-and-bounded-retry-scenario";
import styles from "./timeout-and-bounded-retry-demo.module.css";

const PHASE_LABELS: Record<RetryPhase, string> = {
  request: "Request", timeout: "Timeout", backoff: "Backoff", retry: "Retry", success: "Success", "give-up": "Give up",
};
const PLAYBACK_LABELS = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;

function phaseExplanation(phase: RetryPhase, attempt: number, maxAttempts: number, delay: number, timeout: number) {
  switch (phase) {
    case "request": return `試行 ${attempt}/${maxAttempts}: 合成サービスの応答遅延 ${delay} ms と Timeout ${timeout} ms を比較します。`;
    case "timeout": return `応答遅延が Timeout を超えたため、試行 ${attempt} を Timeout と判定しました。`;
    case "backoff": return `次の負荷集中を避けるため、${backoffMs(attempt)} ms の説明用Backoffを置きます。`;
    case "retry": return attempt < maxAttempts ? `上限内なので試行 ${attempt + 1} へ進みます。` : `${maxAttempts}回の上限に達したため、これ以上Retryしません。`;
    case "success": return `試行 ${attempt} の応答がTimeout以内に収まり、処理を成功として完了しました。`;
    case "give-up": return `最大試行回数 ${maxAttempts} に達したため、安全に打ち切りました。`;
  }
}

export function TimeoutAndBoundedRetryDemo() {
  const [state, dispatch] = useReducer(timeoutAndBoundedRetryReducer, initialTimeoutAndBoundedRetryState);
  const terminal = state.playback === "completed";
  const delay = effectiveDelayMs(state);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), state.phase === "backoff" ? 900 : 700);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.phase, state.attempt]);

  useTemplateLoop(terminal, () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="retry-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="retry-demo-title">Timeout and Bounded Retry</h2>
          <p className={styles.description}>Request → Timeout → Backoff → Retry → Success / Give up の判断を合成データで追跡します。</p>
        </div>
        <div className={styles.statusBadge} data-playback={state.playback} aria-live="polite">
          <span>CURRENT STATE</span><strong>{PLAYBACK_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.statePanel} aria-live="polite">
        <div><span>ATTEMPT {state.attempt} / {state.maxAttempts}</span><strong>{PHASE_LABELS[state.phase]}</strong></div>
        <p>{phaseExplanation(state.phase, state.attempt, state.maxAttempts, delay, state.timeoutMs)}</p>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 940 330" role="img" aria-labelledby="retry-flow-title retry-flow-desc">
          <title id="retry-flow-title">Timeout and Bounded Retry の状態遷移</title>
          <desc id="retry-flow-desc">RequestからTimeout、Backoff、Retryを経てSuccessまたはGive upへ分岐する合成シナリオ</desc>
          <defs><marker id="retry-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" /></marker></defs>
          <g className={styles.paths}>
            <path d="M145 145H220"/><path className={styles.timeoutPath} d="M340 145H415"/><path className={styles.backoffPath} d="M535 145H610"/><path d="M730 145H795"/>
            <path className={styles.successPath} d="M280 100V55H840V100"/><path className={styles.giveUpPath} d="M670 190V250H840V190"/>
          </g>
          {([
            ["request", 25, 100, "Request", "SEND"], ["timeout", 220, 100, "Timeout", "DEADLINE"],
            ["backoff", 415, 100, "Backoff", `${backoffMs(state.attempt)} ms`], ["retry", 610, 100, "Retry", `${state.attempt} / ${state.maxAttempts}`],
            ["success", 795, 100, "Success", "WITHIN LIMIT"], ["give-up", 795, 250, "Give up", "LIMIT REACHED"],
          ] as const).map(([phase, x, y, label, detail]) => (
            <g key={phase} className={`${styles.node} ${styles[phase]} ${state.phase === phase ? styles.active : ""}`} transform={`translate(${x} ${y})`}>
              {phase === "success" ? <circle cx="60" cy="45" r="48" /> : phase === "give-up" ? <path d="M12 0H108L120 45 108 90H12L0 45z" /> : <rect width="120" height="90" rx={phase === "timeout" ? 4 : 18} />}
              <text x="60" y="40" textAnchor="middle">{label}</text><text x="60" y="63" textAnchor="middle" className={styles.nodeDetail}>{detail}</text>
            </g>
          ))}
        </svg>
      </div>

      <ol className={styles.timeline} aria-label="主要な状態遷移">
        {(["request", "timeout", "backoff", "retry"] as const).map((phase, index) => <li key={phase} className={state.phase === phase ? styles.current : ""} aria-current={state.phase === phase ? "step" : undefined}><span>{index + 1}</span><small>{PHASE_LABELS[phase]}</small></li>)}
        <li className={state.phase === "success" || state.phase === "give-up" ? styles.current : ""}><span>5</span><small>Success / Give up</small></li>
      </ol>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || terminal}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <label><span>Service delay <output>{state.serviceDelayMs} ms</output></span><input aria-label="合成サービスの遅延" type="range" min="400" max="2000" step="100" value={state.serviceDelayMs} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-service-delay", value: Number(event.target.value) })}/></label>
        <label><span>Timeout <output>{state.timeoutMs} ms</output></span><input aria-label="Timeout" type="range" min="300" max="1500" step="100" value={state.timeoutMs} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-timeout", value: Number(event.target.value) })}/></label>
        <label><span>Max attempts <output>{state.maxAttempts}</output></span><input aria-label="最大試行回数" type="range" min="1" max="5" step="1" value={state.maxAttempts} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-max-attempts", value: Number(event.target.value) })}/></label>
      </div>

      <aside className={styles.learningNote} aria-label="カテゴリとシナリオの説明">
        <div><strong>Why Reliability &amp; Recovery?</strong><p>障害をTimeoutで検知し、回数を制限したRetryとBackoffで回復を試み、回復不能時は打ち切る判断が主題だからです。</p></div>
        <div><strong>Normal &amp; boundary cases</strong><p>遅延をTimeout以下にすると初回成功、最大試行回数を小さくするとGive upを確認できます。Retryごとの遅延減少は説明用の合成挙動です。</p></div>
        <div><strong>Safe learning environment</strong><p>実クラウドや実サービスには接続しません。値と所要時間は説明用で、性能、可用性、安全性、厳密な時間を保証しません。</p></div>
      </aside>
    </section>
  );
}

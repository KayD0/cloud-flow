"use client";

import { useEffect, useReducer } from "react";
import {
  FLOW_STAGES,
  delayMilliseconds,
  getCurrentStage,
  initialRequestResponseFlowState,
  requestResponseFlowReducer,
} from "@/lib/scenarios/traffic-routing/request-response-flow/request-response-flow-scenario";
import styles from "./request-response-flow-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const TOKEN_POSITIONS = [100, 450, 800, 450, 100] as const;
const PLAYBACK_LABELS = {
  idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED", failed: "FAILED",
} as const;

export function RequestResponseFlowDemo() {
  const [state, dispatch] = useReducer(requestResponseFlowReducer, initialRequestResponseFlowState, (initial) => requestResponseFlowReducer(initial, { type: "start" }));
  const stage = getCurrentStage(state);
  const terminal = state.playback === "completed" || state.playback === "failed";

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setTimeout(
      () => dispatch({ type: "tick" }),
      delayMilliseconds[state.delayMode],
    );
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stageIndex, state.delayMode]);

  const explanation = state.playback === "failed"
    ? "Backend の説明用タイムアウトにより Response を生成できませんでした。Reset して再試行してください。"
    : stage.detail;

  useTemplateLoop(terminal, () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="flow-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="flow-demo-title">Request / Response Flow</h2>
          <p className={styles.description}>Gateway が往路と復路を中継する、ベンダーニュートラルな合成シナリオです。</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.playback]}`} aria-live="polite">
          <span>CURRENT STATE</span><strong>{PLAYBACK_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 900 340" role="img" aria-labelledby="flow-title flow-desc">
          <title id="flow-title">Client、Gateway、Backend 間の Request / Response Flow</title>
          <desc id="flow-desc">Client から Gateway、Backend へ進む Request と、Gateway を経由して Client に戻る Response</desc>
          <defs>
            <marker id="request-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10z" />
            </marker>
            <marker id="response-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10z" />
            </marker>
          </defs>
          <g className={styles.requestPath}>
            <path d="M160 125 H390" /><path d="M510 125 H740" />
            <text x="450" y="94" textAnchor="middle">REQUEST · OUTBOUND</text>
          </g>
          <g className={styles.responsePath}>
            <path d="M740 215 H510" /><path d="M390 215 H160" />
            <text x="450" y="246" textAnchor="middle">RESPONSE · RETURN</text>
          </g>
          <g className={styles.node} transform="translate(40 125)">
            <rect width="120" height="90" rx="18" /><text x="60" y="38" textAnchor="middle">Client</text><text x="60" y="62" textAnchor="middle" className={styles.nodeState}>CALLER</text>
          </g>
          <g className={`${styles.node} ${styles.gateway}`} transform="translate(390 125)">
            <path d="M60 0 L120 24 V66 L60 90 L0 66 V24z" /><text x="60" y="38" textAnchor="middle">Gateway</text><text x="60" y="62" textAnchor="middle" className={styles.nodeState}>ROUTER</text>
          </g>
          <g className={styles.node} transform="translate(740 125)">
            <rect width="120" height="90" rx="18" /><text x="60" y="38" textAnchor="middle">Backend</text><text x="60" y="62" textAnchor="middle" className={styles.nodeState}>{state.playback === "failed" ? "TIMEOUT" : "SERVICE"}</text>
          </g>
          <g className={`${styles.token} ${state.stageIndex >= 3 ? styles.responseToken : styles.requestToken}`} transform={`translate(${TOKEN_POSITIONS[state.stageIndex]} ${state.stageIndex >= 3 ? 215 : 125})`} aria-hidden="true">
            <circle r="13" /><text y="4" textAnchor="middle">{state.stageIndex >= 3 ? "R" : "Q"}</text>
          </g>
        </svg>
      </div>

      <div className={styles.statePanel} aria-live="polite">
        <div><span>STEP {state.stageIndex + 1} / {FLOW_STAGES.length}</span><strong>{state.playback === "failed" ? "Backend timeout" : stage.label}</strong></div>
        <p>{explanation}</p>
      </div>

      <ol className={styles.timeline} aria-label="フローの状態遷移">
        {FLOW_STAGES.map((item, index) => (
          <li key={item.id} className={index === state.stageIndex ? styles.current : index < state.stageIndex ? styles.visited : ""} aria-current={index === state.stageIndex ? "step" : undefined}>
            <span>{index + 1}</span><small>{item.label}</small>
          </li>
        ))}
      </ol>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || terminal}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "step" })} disabled={terminal}>▷ Step</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <fieldset>
          <legend>説明用の遅延</legend>
          <label><input type="radio" name="delay" checked={state.delayMode === "normal"} onChange={() => dispatch({ type: "set-delay", delayMode: "normal" })} /> Normal <small>900 ms</small></label>
          <label><input type="radio" name="delay" checked={state.delayMode === "slow"} onChange={() => dispatch({ type: "set-delay", delayMode: "slow" })} /> Slow <small>1,800 ms</small></label>
        </fieldset>
      </div>

      <div className={styles.boundaryCase}>
        <div><p>BOUNDARY CASE</p><strong>Backend timeout</strong><span>Backend 処理時に合成した失敗状態で停止します。</span></div>
        <label><input type="checkbox" checked={state.backendTimeout} onChange={(event) => dispatch({ type: "set-backend-timeout", enabled: event.target.checked })} disabled={terminal} /> タイムアウトを有効化</label>
      </div>

      <aside className={styles.learningNote} aria-label="カテゴリとシナリオの説明">
        <div><strong>Why Traffic &amp; Routing?</strong><p>主題は処理内容ではなく、Request と Response が Gateway を経由してどの経路を移動するかだからです。</p></div>
        <div><strong>Safe learning environment</strong><p>表示値と遅延はすべて説明用です。実クラウド、実サービス、実運用データへ接続せず、性能や可用性を保証しません。</p></div>
      </aside>
    </section>
  );
}

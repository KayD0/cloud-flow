"use client";

import { useEffect, useReducer } from "react";
import { circuitBreakerReducer, circuitStateDescriptions, initialCircuitBreakerState, type CircuitState } from "@/lib/scenarios/reliability-recovery/circuit-breaker/circuit-breaker-scenario";
import styles from "./circuit-breaker-demo.module.css";

const stateOrder: readonly CircuitState[] = ["closed", "open", "half-open"];

export function CircuitBreakerDemo() {
  const [state, dispatch] = useReducer(circuitBreakerReducer, initialCircuitBreakerState, (initial) => circuitBreakerReducer(initial, { type: "start" }));
  const current = circuitStateDescriptions[state.circuit];

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1100);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.demo} aria-labelledby="circuit-demo-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE RECOVERY LAB</p><h2 id="circuit-demo-title">Circuit Breaker State Lab</h2><p>合成リクエストで遮断と回復判定を安全に観察します。</p></div>
        <div className={styles.currentState} data-state={state.circuit}><span>CURRENT STATE</span><strong>{current.label}</strong><small>{state.playback.toUpperCase()}</small></div>
      </header>

      <div className={styles.decision} aria-live="polite"><span aria-hidden="true">?</span><div><strong>{state.lastTransition}</strong><p>{state.decision}</p></div></div>

      <div className={styles.stage}>
        <div className={styles.flow} aria-label="Closed、Open、Half-open の状態遷移">
          {stateOrder.map((circuit, index) => <div className={styles.flowItem} key={circuit}>
            <article className={styles.stateCard} data-state={circuit} data-active={state.circuit === circuit} aria-current={state.circuit === circuit ? "step" : undefined}>
              <span className={styles.shape} aria-hidden="true" /><small>STATE {index + 1}</small><strong>{circuitStateDescriptions[circuit].label}</strong><p>{circuitStateDescriptions[circuit].detail}</p>
            </article>
            {index < stateOrder.length - 1 && <span className={styles.arrow} aria-hidden="true">→</span>}
          </div>)}
        </div>
        <div className={styles.returnPaths}><span>成功 ───── Half-open → Closed</span><span>失敗 ┈┈┈┈ Half-open → Open</span></div>

        <div className={styles.serviceFlow} data-state={state.circuit}>
          <div className={styles.clientNode}><span>CLIENT</span><strong>合成リクエスト</strong></div>
          <div className={styles.route}><i /><b>{state.circuit === "open" ? "BLOCKED" : state.circuit === "half-open" ? "PROBE ONLY" : "FORWARDED"}</b></div>
          <div className={styles.dependencyNode}><span>DEPENDENCY</span><strong>{state.injectFailure ? "FAIL RESPONSE" : "HEALTHY RESPONSE"}</strong></div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div><span>FAILURES / THRESHOLD</span><strong>{state.consecutiveFailures} / {state.failureThreshold}</strong></div>
        <div><span>RECOVERY PROBES</span><strong>{state.successfulTrials} / {state.recoveryTrials}</strong></div>
        <div><span>FORWARDED</span><strong>{state.forwardedRequests}</strong></div>
        <div><span>PROTECTED / BLOCKED</span><strong>{state.blockedRequests}</strong></div>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <div className={styles.settings}>
          <button type="button" className={state.injectFailure ? styles.failureOn : undefined} aria-pressed={state.injectFailure} onClick={() => dispatch({ type: "set-failure-injection", value: !state.injectFailure })}>{state.injectFailure ? "● 失敗注入 ON" : "○ 失敗注入 OFF"}</button>
          <label>失敗閾値 <select value={state.failureThreshold} onChange={(event) => dispatch({ type: "set-threshold", value: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>回復試行 <select value={state.recoveryTrials} onChange={(event) => dispatch({ type: "set-recovery-trials", value: Number(event.target.value) })}>{[1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </div>

      <div className={styles.guidance}><div><span>NORMAL PATH</span><p>失敗注入 OFF では Closed を維持します。Open 後に OFF にすると、Half-open の回復試行を経て Closed へ復旧します。</p></div><div><span>FAILURE / BOUNDARY</span><p>Half-open でも失敗注入が ON なら Open へ戻ります。閾値 1 では最初の失敗で即時遮断します。</p></div><div><span>WHY RELIABILITY &amp; RECOVERY?</span><p>通信経路の選択ではなく、障害の連鎖を遮断して依存先を保護し、安全な回復を判定することが中心だからです。</p></div><div><span>SAFE SANDBOX</span><p>値、時間、応答はすべて説明用の合成データです。実サービスへ接続せず、Reset で初期状態へ戻ります。</p></div></div>
    </section>
  );
}

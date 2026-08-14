"use client";

import { useEffect, useReducer } from "react";
import {
  ALLOCATION_TOLERANCE,
  FAILURE_RATE_LIMIT,
  REQUEST_COUNT,
  TARGET_CANARY_WEIGHT,
  evaluateRoute,
  initialWeightedRoutingState,
  weightedRoutingReducer,
} from "@/lib/scenarios/traffic-routing/weighted-routing/weighted-routing-scenario";
import styles from "./weighted-routing-demo.module.css";

const PHASE_LABEL = { setup: "設定中", running: "配送中", paused: "一時停止", won: "成功", failed: "要再挑戦" } as const;

export function WeightedRoutingDemo() {
  const [state, dispatch] = useReducer(weightedRoutingReducer, initialWeightedRoutingState);
  const preview = evaluateRoute(state.canaryWeight);
  const stableWeight = 100 - state.canaryWeight;
  const canEdit = state.phase === "setup" || state.phase === "paused";

  useEffect(() => {
    if (state.phase !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 180);
    return () => window.clearInterval(timer);
  }, [state.phase]);


  return (
    <section className={styles.game} aria-labelledby="canary-control-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>TRAFFIC &amp; ROUTING · MINI GAME</p>
          <h2 id="canary-control-title">カナリア・コントロール</h2>
          <p>あなたはリリース管制官。Stable と Canary の重みを調整し、安全に変更を配送してください。</p>
        </div>
        <div className={styles.phase} data-phase={state.phase}><span>現在の状態</span><strong>{PHASE_LABEL[state.phase]}</strong></div>
      </header>

      <div className={styles.briefing} aria-label="ミッション概要">
        <article><span>役割</span><strong>リリース管制官</strong><p>変更の露出範囲を判断する</p></article>
        <article><span>勝利条件</span><strong>Canary {TARGET_CANARY_WEIGHT}% ±{ALLOCATION_TOLERANCE}pt</strong><p>障害率 {FAILURE_RATE_LIMIT}% 以下も同時に達成</p></article>
        <article><span>失敗条件</span><strong>配分誤差・障害率の超過</strong><p>どちらかが上限を超えると失敗</p></article>
      </div>

      <fieldset className={styles.modePicker} disabled={state.phase !== "setup"}>
        <legend>プレイモード</legend>
        <label><input type="radio" name="mode" value="guided" checked={state.mode === "guided"} onChange={() => dispatch({ type: "select-mode", mode: "guided" })} /><span><strong>Guided</strong> 判断のヒントと安全範囲を表示</span></label>
        <label><input type="radio" name="mode" value="challenge" checked={state.mode === "challenge"} onChange={() => dispatch({ type: "select-mode", mode: "challenge" })} /><span><strong>Challenge</strong> 3つの評価軸で採点</span></label>
      </fieldset>

      <div className={styles.workspace}>
        <section className={styles.controlPanel} aria-labelledby="route-control-title">
          <div className={styles.sectionHeading}><div><span>ROUTING PLAN</span><h3 id="route-control-title">配送ウェイト</h3></div><strong>{stableWeight} : {state.canaryWeight}</strong></div>
          <label className={styles.slider}>
            <span><strong>Canary の重み</strong><output>{state.canaryWeight}%</output></span>
            <input type="range" min="0" max="100" step="5" value={state.canaryWeight} disabled={!canEdit} onChange={(event) => dispatch({ type: "set-canary-weight", weight: Number(event.target.value) })} aria-describedby="weight-help" />
          </label>
          <div className={styles.weightBar} role="img" aria-label={`Stable ${stableWeight}%、Canary ${state.canaryWeight}%`}>
            <span style={{ width: `${stableWeight}%` }}>Stable {stableWeight}%</span><span style={{ width: `${state.canaryWeight}%` }}>{state.canaryWeight > 9 ? `Canary ${state.canaryWeight}%` : ""}</span>
          </div>
          <p id="weight-help" className={styles.help}>{state.mode === "guided" ? "ヒント: まず目標の 20% に合わせます。重みはリクエストの配送割合を決めます。" : "目標と安全条件を確認して配分を決めてください。"}</p>
          <div className={styles.transport} aria-label="ゲーム操作">
            <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.phase === "running" || state.phase === "won" || state.phase === "failed"}>▶ 配送開始</button>
            <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.phase !== "running"}>Ⅱ Pause</button>
            <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
          </div>
        </section>

        <section className={styles.monitor} aria-labelledby="monitor-title">
          <div className={styles.sectionHeading}><div><span>FIXED SCENARIO · SEED 13</span><h3 id="monitor-title">配送モニター</h3></div><strong>{state.dispatched}/{REQUEST_COUNT}</strong></div>
          <div className={styles.routeMap} aria-label="Client から Router を経て Stable と Canary へ配送する経路">
            <div className={styles.client}>CLIENT</div><div className={styles.arrow}>→</div><div className={styles.router}>ROUTER</div><div className={styles.fork}>⇢<br />⇢</div>
            <div className={styles.targets}><span>● Stable</span><span>◇ Canary</span></div>
          </div>
          <progress max={REQUEST_COUNT} value={state.dispatched}>{state.dispatched}/{REQUEST_COUNT}</progress>
          <dl className={styles.metrics}>
            <div><dt>配分誤差</dt><dd>{preview.allocationError} pt <small>上限 {ALLOCATION_TOLERANCE}</small></dd></div>
            <div><dt>Canary 合成障害率</dt><dd>{preview.canaryFailureRate}% <small>上限 {FAILURE_RATE_LIMIT}%</small></dd></div>
          </dl>
        </section>
      </div>

      <div className={styles.status} role="status" aria-live="polite">
        {state.phase === "setup" && <p><strong>最初の判断:</strong> Canary の重みを決めて「配送開始」を押してください。</p>}
        {state.phase === "running" && <p><strong>配送中:</strong> 固定シナリオへリクエストを送っています。Pause で判断を見直せます。</p>}
        {state.phase === "paused" && <p><strong>一時停止:</strong> 次の配送前に重みを変更できます。再開すると新しい配分が適用されます。</p>}
        {state.result && <ResultPanel result={state.result} challenge={state.mode === "challenge"} />}
      </div>

      <p className={styles.disclaimer}>このゲームはベンダーニュートラルな合成データのみを使用し、実環境には作用しません。値とスコアは学習用で、性能・可用性・安全性を保証しません。</p>
    </section>
  );
}

function ResultPanel({ result, challenge }: { result: ReturnType<typeof evaluateRoute>; challenge: boolean }) {
  return <div className={styles.result} data-outcome={result.outcome}>
    <div><span aria-hidden="true">{result.outcome === "won" ? "✓" : "!"}</span><div><strong>{result.outcome === "won" ? "ミッション成功" : "ミッション失敗"}</strong><p>{result.reason}</p></div></div>
    <ul aria-label="配送結果"><li>Stable 成功 <strong>{result.delivered.stable}</strong></li><li>Canary 成功 <strong>{result.delivered.canary}</strong></li><li>失敗 <strong>{result.delivered.failed}</strong></li></ul>
    {challenge && <div className={styles.score}><strong>総合 {result.score.total}点</strong><span>正確性 {result.score.accuracy}</span><span>安全性 {result.score.safety}</span><span>可用性 {result.score.availability}</span></div>}
    <p className={styles.retry}>Reset で同じ Seed 13 の初期状態から再挑戦できます。</p>
  </div>;
}

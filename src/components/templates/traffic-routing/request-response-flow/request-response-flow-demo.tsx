"use client";

import { useEffect, useReducer } from "react";
import {
  ROUTES,
  calculateScore,
  getResultExplanation,
  initialRequestResponseFlowState,
  requestResponseFlowReducer,
} from "@/lib/scenarios/traffic-routing/request-response-flow/request-response-flow-scenario";
import styles from "./request-response-flow-demo.module.css";

const STATUS_LABEL = { briefing: "開始前", playing: "配送中", paused: "一時停止", won: "往復完了", failed: "配送失敗" } as const;

export function RequestResponseFlowDemo() {
  const [state, dispatch] = useReducer(requestResponseFlowReducer, initialRequestResponseFlowState);
  const terminal = state.status === "won" || state.status === "failed";

  useEffect(() => {
    if (state.status !== "playing") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  const guidedHint = state.leg === "request"
    ? "ヒント: GET /profile はデータを組み立てる動的処理です。各 Server の役割を比べましょう。"
    : "ヒント: Response は、新しい宛先ではなく要求を送った相手へ返します。";

  return (
    <section className={styles.game} aria-labelledby="relay-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>TRAFFIC &amp; ROUTING · MINI GAME</p><h2 id="relay-title">リクエスト・リレー</h2><p>通信オペレーターとして、要求と応答を正しい経路へ中継します。</p></div>
        <div className={styles.status} role="status" aria-live="polite"><span>状態</span><strong>{STATUS_LABEL[state.status]}</strong></div>
      </header>

      <section className={styles.briefing} aria-labelledby="mission-title">
        <div><p className={styles.label}>YOUR ROLE</p><strong>通信オペレーター</strong></div>
        <div><p className={styles.label} id="mission-title">MISSION</p><strong>要求を正しい Server へ送り、Response を Client へ戻す</strong></div>
        <div><p className={styles.label}>WIN / LOSE</p><strong>60秒以内の往復で勝利 · 誤配送またはタイムアウトで失敗</strong></div>
      </section>

      <div className={styles.modeRow}>
        <fieldset disabled={state.status !== "briefing"}><legend>モード</legend>
          <label><input type="radio" name="mode" checked={state.mode === "guided"} onChange={() => dispatch({ type: "set-mode", mode: "guided" })} /> Guided <small>ヒント付き</small></label>
          <label><input type="radio" name="mode" checked={state.mode === "challenge"} onChange={() => dispatch({ type: "set-mode", mode: "challenge" })} /> Challenge <small>正確性 70% + 残り時間 30%</small></label>
        </fieldset>
        <div className={styles.timer}><span>TIME LEFT</span><strong>{state.timeRemaining}</strong><small>秒</small></div>
      </div>

      <section className={styles.board} aria-label="配送ボード">
        <div className={styles.packet}>
          <p className={styles.label}>{state.leg === "request" ? "REQUEST CARD" : "RESPONSE CARD"}</p>
          <strong>{state.leg === "request" ? "GET /profile" : "200 OK · PROFILE DATA"}</strong>
          <span>{state.leg === "request" ? "要求元: Client A · 種類: 動的データ" : "返却先: 要求元 · 相関ID: R-001"}</span>
        </div>
        <div className={styles.flow} aria-label={`現在の目標: ${state.leg === "request" ? "Request を Server へ送る" : "Response を Client へ戻す"}`}>
          <span className={state.leg === "request" ? styles.activeStep : ""}>① REQUEST</span><i aria-hidden="true">→</i><span>SERVER</span><i aria-hidden="true">⇢</i><span className={state.leg === "response" ? styles.activeStep : ""}>② RESPONSE → CLIENT</span>
        </div>
        <fieldset className={styles.routes} disabled={state.status !== "playing"}><legend>{state.leg === "request" ? "Request の配送先" : "Response の返却先"}を選択</legend>
          {ROUTES.map((route) => <label key={route.id} className={state.selectedRoute === route.id ? styles.selected : ""}>
            <input type="radio" name="route" checked={state.selectedRoute === route.id} onChange={() => dispatch({ type: "select-route", route: route.id })} />
            <span className={styles.routeIcon} aria-hidden="true">{route.shape === "circle" ? "●" : route.shape === "hexagon" ? "⬡" : route.shape === "diamond" ? "◆" : "■"}</span>
            <strong>{route.label}</strong><small>{route.hint}</small>
          </label>)}
        </fieldset>
        {state.mode === "guided" && !terminal && <p className={styles.hint}><strong>GUIDED</strong> {guidedHint}</p>}
      </section>

      <div className={styles.controls} aria-label="ゲーム操作">
        {state.status === "briefing" && <button className={styles.primary} onClick={() => dispatch({ type: "start" })}>Start</button>}
        {state.status === "playing" && <><button onClick={() => dispatch({ type: "pause" })}>Pause</button><button className={styles.primary} disabled={!state.selectedRoute} onClick={() => dispatch({ type: "send" })}>選択した経路へ送信</button></>}
        {state.status === "paused" && <button className={styles.primary} onClick={() => dispatch({ type: "resume" })}>再開</button>}
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      </div>

      <div className={styles.feedback} aria-live="polite"><p className={styles.label}>WHY / FEEDBACK</p><strong>{state.feedback}</strong>{terminal && <p>{getResultExplanation(state)}</p>}</div>

      {terminal && <section className={state.status === "won" ? styles.resultWin : styles.resultFail} aria-labelledby="result-title">
        <p className={styles.label}>ROUND RESULT</p><h3 id="result-title">{state.status === "won" ? "往復通信 成功" : "往復通信 失敗"}</h3>
        {state.mode === "challenge" && <p className={styles.score}>SCORE <strong>{calculateScore(state)}</strong> / 1000 <span>正確性 {state.decisions ? Math.round(state.correctDecisions / state.decisions * 100) : 0}% · 残り {state.timeRemaining}秒</span></p>}
        <button onClick={() => dispatch({ type: "reset" })}>同じシナリオに再挑戦</button>
      </section>}

      <details className={styles.boundary}><summary>境界ケース: API Server 利用不能</summary><p>正しい経路でも Server が利用不能なら往復は完了しません。</p><label><input type="checkbox" checked={state.serverUnavailable} disabled={state.status !== "briefing"} onChange={(event) => dispatch({ type: "set-server-unavailable", enabled: event.target.checked })} /> 固定シナリオで API Server を利用不能にする</label></details>
      <footer className={styles.disclaimer}>このゲームはベンダーニュートラルな合成データだけを使用し、実環境へ接続・操作しません。時間とスコアは学習用で、性能・可用性・安全性を保証しません。</footer>
    </section>
  );
}

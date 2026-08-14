"use client";

import { useReducer } from "react";
import {
  getChallengeScore,
  getGuidance,
  getResultExplanation,
  initialPrivateEndpointState,
  privateEndpointReducer,
  TOTAL_REQUESTS,
} from "@/lib/scenarios/network-connectivity/private-link-private-endpoint/private-link-private-endpoint-scenario";
import styles from "./private-link-private-endpoint-demo.module.css";

const phaseLabels = {
  ready: "開始前",
  playing: "設計中",
  paused: "一時停止",
  won: "成功",
  lost: "失敗",
} as const;

export function PrivateLinkPrivateEndpointDemo() {
  const [state, dispatch] = useReducer(privateEndpointReducer, initialPrivateEndpointState);
  const score = getChallengeScore(state);
  const isFinished = state.phase === "won" || state.phase === "lost";
  const controlsEnabled = state.phase === "ready" || state.phase === "playing";

  return (
    <section className={styles.game} aria-labelledby="private-path-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>NETWORK &amp; CONNECTIVITY · GAME 19</p>
          <h2 id="private-path-title">プライベート・パス</h2>
          <p>あなたは「非公開経路設計者」。3 件の Request を公開経路へ流出させず Managed Service へ届けます。</p>
        </div>
        <div className={`${styles.status} ${styles[state.phase]}`} aria-live="polite">
          <span>ゲーム状態</span><strong>{phaseLabels[state.phase]}</strong>
        </div>
      </header>

      <section className={styles.briefing} aria-labelledby="mission-title">
        <div><span>ROLE</span><strong id="mission-title">非公開経路設計者</strong></div>
        <div><span>OBJECTIVE</span><strong>Public Internet を避けて到達</strong></div>
        <div><span>WIN</span><strong>全 3 Request を Private Endpoint 経由</strong></div>
        <div><span>FAIL</span><strong>Public Route への流出</strong></div>
      </section>

      <div className={styles.modeBar}>
        <div role="group" aria-label="ゲームモード">
          <button type="button" aria-pressed={state.mode === "guided"} onClick={() => dispatch({ type: "select-mode", mode: "guided" })}>Guided</button>
          <button type="button" aria-pressed={state.mode === "challenge"} onClick={() => dispatch({ type: "select-mode", mode: "challenge" })}>Challenge</button>
        </div>
        <p>{state.mode === "guided" ? "操作と理由を段階的に案内します。" : "安全性 50%・正確性 30%・可用性 20% で採点します。"}</p>
      </div>

      <div className={styles.dashboard}>
        <div className={styles.playArea}>
          <div className={styles.objectiveBar}>
            <div><span>CURRENT GOAL</span><strong>Private Endpoint を通して通信確認</strong></div>
            <div><span>REMAINING</span><strong>{TOTAL_REQUESTS - state.completedRequests} Request</strong></div>
          </div>

          <div className={styles.network} aria-label="Client から Managed Service までの選択中の通信経路">
            <div className={`${styles.node} ${styles.client}`}><span>PRIVATE NETWORK</span><strong>Client</strong><small>合成 Request</small></div>
            <div className={`${styles.route} ${state.selectedRoute === "private" ? styles.routeSelected : ""}`}><span>━━ PRIVATE ROUTE ━━▶</span></div>
            <div className={`${styles.node} ${styles.endpoint} ${state.endpointPlaced ? styles.endpointReady : styles.endpointMissing}`}>
              <span>CONNECTION TARGET</span><strong>Private Endpoint</strong><small>{state.endpointPlaced ? "配置済み ✓" : "未配置 ◇"}</small>
            </div>
            <div className={`${styles.route} ${state.selectedRoute === "private" && state.endpointPlaced ? styles.routeSelected : ""}`}><span>━━ PRIVATE LINK ━━▶</span></div>
            <div className={`${styles.node} ${styles.service}`}><span>MANAGED SERVICE</span><strong>Data Service</strong><small>説明用の合成サービス</small></div>
            <div className={`${styles.publicLane} ${state.selectedRoute === "public" ? styles.publicSelected : ""}`}>
              <strong>PUBLIC INTERNET</strong><span>┄┄ Public Route ┄┄▶</span><small>{state.selectedRoute === "public" ? "選択中 ⚠" : "未選択"}</small>
            </div>
          </div>

          <div className={styles.actions} aria-label="ゲーム固有操作">
            <button type="button" aria-pressed={state.endpointPlaced} disabled={!controlsEnabled} onClick={() => dispatch({ type: "toggle-endpoint" })}>
              <span>1 · ENDPOINT</span><strong>{state.endpointPlaced ? "Endpoint を撤去" : "Endpoint を配置"}</strong>
            </button>
            <fieldset disabled={!controlsEnabled}>
              <legend>2 · ROUTE SELECT</legend>
              <label><input type="radio" name="route" checked={state.selectedRoute === "private"} onChange={() => dispatch({ type: "select-route", route: "private" })} /> Private Route</label>
              <label><input type="radio" name="route" checked={state.selectedRoute === "public"} onChange={() => dispatch({ type: "select-route", route: "public" })} /> Public Route</label>
            </fieldset>
            <button className={styles.verify} type="button" disabled={state.phase !== "playing"} onClick={() => dispatch({ type: "send-request" })}>
              <span>3 · VERIFY</span><strong>通信確認を実行</strong>
            </button>
          </div>
        </div>

        <aside className={styles.sidePanel} aria-labelledby="feedback-title">
          {state.mode === "guided" && <div className={styles.guide}><span>GUIDED NEXT STEP</span><p>{getGuidance(state)}</p></div>}
          <div className={styles.feedback}>
            <span>WHY THIS RESULT?</span><h3 id="feedback-title">判断の理由</h3>
            <p aria-live="polite">{getResultExplanation(state)}</p>
            {state.lastResult && <strong className={styles.resultLabel}>結果: {state.lastResult.outcome === "private" ? "非公開経路で到達 ✓" : state.lastResult.outcome === "public" ? "公開経路へ流出 ✕" : "Endpoint 未配置で遮断 ◇"}</strong>}
          </div>
          <ol className={styles.progress} aria-label="Request の進捗">
            {Array.from({ length: TOTAL_REQUESTS }, (_, index) => <li key={index} className={index < state.completedRequests ? styles.complete : ""}><span>Request {index + 1}</span><strong>{index < state.completedRequests ? "PRIVATE ✓" : "WAITING ◇"}</strong></li>)}
          </ol>
        </aside>
      </div>

      {isFinished && <section className={`${styles.result} ${state.phase === "won" ? styles.resultWon : styles.resultLost}`} aria-labelledby="game-result-title">
        <div><span>GAME RESULT</span><h3 id="game-result-title">{state.phase === "won" ? "ミッション成功" : "Public Route へ流出"}</h3><p>{state.phase === "won" ? "すべての Request が非公開経路で完了しました。" : "到達性だけでなく、どの境界を通るかが Private Link 設計の判断点です。"}</p></div>
        {state.mode === "challenge" && <div className={styles.score}><strong>{score.total}<small>/100</small></strong><span>RANK {score.rank}</span><dl><div><dt>安全性 50%</dt><dd>{score.safety}</dd></div><div><dt>正確性 30%</dt><dd>{score.accuracy}</dd></div><div><dt>可用性 20%</dt><dd>{score.availability}</dd></div></dl></div>}
        <button type="button" onClick={() => dispatch({ type: "reset" })}>同じシナリオに再挑戦</button>
      </section>}

      <footer className={styles.footer}>
        <div className={styles.transport} aria-label="ゲーム操作">
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.phase === "playing" || isFinished}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.phase !== "playing"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <p>このゲームは固定シナリオと合成データのみを使用し、実環境への操作・性能・可用性・安全性を保証しません。</p>
      </footer>
    </section>
  );
}

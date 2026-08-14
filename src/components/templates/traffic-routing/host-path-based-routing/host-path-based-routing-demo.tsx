"use client";

import { useReducer } from "react";
import {
  initialRoutingGameState,
  routingGameReducer,
  routingRequests,
  routingRules,
  scoreRoutingGame,
  type BackendId,
} from "@/lib/scenarios/traffic-routing/host-path-based-routing/host-path-based-routing-scenario";
import styles from "./host-path-based-routing-demo.module.css";

const serviceLabels: Record<BackendId, string> = {
  web: "Web Service",
  api: "API Service",
  admin: "Admin Service",
};

const statusLabels = { ready: "準備中", playing: "判断中", paused: "解説中", won: "配送完了", lost: "配送失敗" } as const;

export function HostPathBasedRoutingDemo() {
  const [state, dispatch] = useReducer(routingGameReducer, initialRoutingGameState);
  const request = routingRequests[state.roundIndex];
  const score = scoreRoutingGame(state);
  const resolved = state.status === "paused" && state.correctCount === state.roundIndex + 1;
  const finished = state.status === "won" || state.status === "lost";

  return (
    <section className={styles.game} aria-labelledby="route-sorter-title">
      <header className={styles.gameHeader}>
        <div>
          <p className={styles.eyebrow}>TRAFFIC &amp; ROUTING · MINI GAME 01</p>
          <h2 id="route-sorter-title">ルート・ソーター</h2>
          <p>あなたはGatewayルール設計者。HostとPathを読み、Requestを正しいServiceへ仕分けます。</p>
        </div>
        <div className={styles.stateBadge} data-status={state.status} aria-live="polite">
          <span>GAME STATUS</span><strong>{statusLabels[state.status]}</strong>
        </div>
      </header>

      <div className={styles.briefing} aria-label="ゲーム説明">
        <article><span>役割</span><strong>Gatewayルール設計者</strong></article>
        <article><span>目的</span><strong>全4件を正しく配送</strong></article>
        <article><span>勝利</span><strong>4件連続正解</strong></article>
        <article><span>失敗</span><strong>誤ルート / Default誤用</strong></article>
      </div>

      <fieldset className={styles.modePicker} disabled={state.status !== "ready"}>
        <legend>プレイモード</legend>
        <label className={state.mode === "guided" ? styles.selectedMode : ""}>
          <input type="radio" name="mode" checked={state.mode === "guided"} onChange={() => dispatch({ type: "set-mode", mode: "guided" })} />
          <span><strong>Guided</strong><small>判断のヒントを段階表示</small></span>
        </label>
        <label className={state.mode === "challenge" ? styles.selectedMode : ""}>
          <input type="radio" name="mode" checked={state.mode === "challenge"} onChange={() => dispatch({ type: "set-mode", mode: "challenge" })} />
          <span><strong>Challenge</strong><small>正確性100点 + 安全性25点</small></span>
        </label>
      </fieldset>

      <div className={styles.hud} aria-label="現在の目標と進行状況">
        <div><span>CURRENT GOAL</span><strong>Request {Math.min(state.roundIndex + 1, routingRequests.length)} / {routingRequests.length} を配送</strong></div>
        <div><span>STREAK</span><strong>{state.correctCount} / {routingRequests.length}</strong></div>
        <div><span>MODE</span><strong>{state.mode === "guided" ? "GUIDED" : "CHALLENGE"}</strong></div>
      </div>

      <div className={styles.board} aria-label="ルーティングゲーム盤面">
        <article className={styles.requestCard}>
          <p className={styles.panelLabel}>INCOMING REQUEST</p>
          <div className={styles.packet} aria-label={`Host ${request.host}, Path ${request.path}`}>
            <span aria-hidden="true">REQ</span>
            <dl><div><dt>Host</dt><dd>{request.host}</dd></div><div><dt>Path</dt><dd>{request.path}</dd></div></dl>
          </div>
          {state.mode === "guided" && state.status !== "ready" && !finished && (
            <aside className={styles.hint}><strong>GUIDE</strong><p>{request.hint}</p></aside>
          )}
        </article>

        <div className={styles.arrow} aria-hidden="true"><span>SELECT</span>→</div>

        <article className={styles.rulesPanel}>
          <p className={styles.panelLabel}>GATEWAY RULES · 1つ選択</p>
          <div className={styles.ruleList} role="radiogroup" aria-label="配送ルール">
            {routingRules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                role="radio"
                aria-checked={state.selectedRuleId === rule.id}
                disabled={state.status !== "playing"}
                className={state.selectedRuleId === rule.id ? styles.selectedRule : ""}
                onClick={() => dispatch({ type: "select-rule", ruleId: rule.id })}
              >
                <span className={styles.ruleIcon} aria-hidden="true">{rule.isDefault ? "◇" : "◆"}</span>
                <span><strong>{rule.label}</strong><code>Host: {rule.host}</code><code>Path prefix: {rule.pathPrefix}</code><small>→ {serviceLabels[rule.backend]}</small></span>
              </button>
            ))}
          </div>
          <button className={styles.routeButton} type="button" disabled={state.status !== "playing" || state.selectedRuleId === null} onClick={() => dispatch({ type: "route-request" })}>
            Requestを投入
          </button>
        </article>

        <div className={styles.arrow} aria-hidden="true"><span>DELIVER</span>→</div>

        <article className={styles.servicesPanel}>
          <p className={styles.panelLabel}>DESTINATIONS</p>
          {(Object.entries(serviceLabels) as [BackendId, string][]).map(([id, label]) => {
            const selectedRule = routingRules.find((rule) => rule.id === state.selectedRuleId);
            const active = (resolved || finished) && selectedRule?.backend === id;
            return <div key={id} className={active ? styles.activeService : ""}><span aria-hidden="true">▣</span><strong>{label}</strong><small>{active ? (state.status === "lost" ? "MISROUTED" : "DELIVERED") : "STANDBY"}</small></div>;
          })}
        </article>
      </div>

      <div className={styles.feedback} role="status" aria-live="polite" data-result={state.status}>
        <span aria-hidden="true">{state.status === "lost" ? "!" : state.status === "won" || resolved ? "✓" : "i"}</span>
        <div><strong>{finished ? statusLabels[state.status] : resolved ? "判断の理由" : "ROUTING NOTE"}</strong><p>{state.feedback}</p></div>
      </div>

      {state.mode === "challenge" && (finished || resolved) && (
        <div className={styles.scorecard} aria-label="Challenge採点結果">
          <strong>CHALLENGE SCORE</strong><span>正確性 {score.accuracy} / 100</span><span>安全性 {score.safety} / 25</span><b>合計 {score.total} / 125</b>
        </div>
      )}

      <div className={styles.controls} aria-label="ゲーム操作">
        <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.status !== "ready" && state.status !== "paused" || resolved}>▶ Start</button>
        <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.status !== "playing"}>Ⅱ Pause</button>
        {resolved && <button type="button" onClick={() => dispatch({ type: "next-request" })}>次のRequest →</button>}
        <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset / 再挑戦</button>
        <p>固定シナリオ・合成データのみを使用します。表示値は説明用で、実環境への通信や変更は行いません。</p>
      </div>
    </section>
  );
}

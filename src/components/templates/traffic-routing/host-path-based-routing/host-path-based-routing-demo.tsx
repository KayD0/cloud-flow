"use client";

import { useEffect, useReducer } from "react";
import {
  initialRoutingState,
  orderedRules,
  routingReducer,
  type BackendId,
} from "@/lib/scenarios/traffic-routing/host-path-based-routing/host-path-based-routing-scenario";
import styles from "./host-path-based-routing-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const backendLabels: Record<BackendId, string> = {
  web: "Web Backend",
  api: "API Backend",
  admin: "Admin Backend",
};

const phaseLabels = {
  initial: "READY",
  "inspect-request": "REQUEST INSPECTION",
  evaluating: "RULE EVALUATION",
  matched: "MATCHED",
  delivered: "DELIVERED",
  "no-match": "NO MATCH",
} as const;

export function HostPathBasedRoutingDemo() {
  const [state, dispatch] = useReducer(routingReducer, initialRoutingState, (initial) => routingReducer(initial, { type: "start" }));
  const rules = orderedRules(state.rules);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 900);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  const activeRuleId = state.evaluationIndex === null ? null : rules[state.evaluationIndex]?.id;
  const flowReachedRules = ["evaluating", "matched", "delivered", "no-match"].includes(state.phase);
  const controlsDisabled = state.playback === "running";

  useTemplateLoop(state.phase === "delivered" || state.phase === "no-match", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="routing-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="routing-demo-title">Host / Path-based Routing</h2>
          <p className={styles.description}>Request属性を優先順位順のルールと照合し、配送先が決まる理由を一段ずつ確認します。</p>
        </div>
        <div className={`${styles.phaseBadge} ${state.phase === "no-match" ? styles.failureBadge : ""}`} aria-live="polite">
          <span>CURRENT STATE</span>
          <strong>{phaseLabels[state.phase]}</strong>
        </div>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.requestPanel} aria-label="Request属性">
          <p className={styles.panelLabel}>1 · REQUEST ATTRIBUTES</p>
          <label>
            <span>Host</span>
            <select value={state.host} disabled={controlsDisabled} onChange={(event) => dispatch({ type: "set-host", host: event.target.value })}>
              <option value="app.learn.local">app.learn.local</option>
              <option value="admin.learn.local">admin.learn.local</option>
              <option value="unknown.learn.local">unknown.learn.local</option>
            </select>
          </label>
          <label>
            <span>Path</span>
            <input value={state.path} disabled={controlsDisabled} onChange={(event) => dispatch({ type: "set-path", path: event.target.value })} placeholder="/api/orders" />
          </label>
          <div className={`${styles.requestToken} ${state.phase !== "initial" ? styles.activeToken : ""}`}>
            <span>HTTP REQUEST</span>
            <code>{state.host}{state.path}</code>
          </div>
        </aside>

        <div className={`${styles.connector} ${flowReachedRules ? styles.activeConnector : ""}`} aria-hidden="true"><span>REQUEST</span>→</div>

        <div className={styles.rulesPanel}>
          <p className={styles.panelLabel}>2 · ROUTING RULES · FIRST MATCH WINS</p>
          <ol className={styles.ruleList}>
            {rules.map((rule, index) => {
              const isActive = activeRuleId === rule.id;
              const isMatched = state.matchedRuleId === rule.id;
              return (
                <li key={rule.id} className={`${isActive ? styles.activeRule : ""} ${isMatched ? styles.matchedRule : ""}`}>
                  <div className={styles.priority} aria-label={`優先順位 ${index + 1}`}>{index + 1}</div>
                  <div className={styles.ruleText}>
                    <strong>{rule.label}</strong>
                    <code>Host = {rule.host}</code>
                    <code>Path starts with {rule.pathPrefix}</code>
                    <span>→ {backendLabels[rule.backend]}</span>
                  </div>
                  <div className={styles.orderButtons} aria-label={`${rule.label}の優先順位`}>
                    <button type="button" disabled={controlsDisabled || index === 0} onClick={() => dispatch({ type: "move-rule", ruleId: rule.id, direction: "up" })} aria-label={`${rule.label}を上へ`}>↑</button>
                    <button type="button" disabled={controlsDisabled || index === rules.length - 1} onClick={() => dispatch({ type: "move-rule", ruleId: rule.id, direction: "down" })} aria-label={`${rule.label}を下へ`}>↓</button>
                  </div>
                  <span className={styles.ruleStatus}>{isMatched ? "MATCH" : isActive ? "CHECKING" : "WAITING"}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={`${styles.connector} ${state.phase === "matched" || state.phase === "delivered" ? styles.activeConnector : ""}`} aria-hidden="true"><span>ROUTE</span>→</div>

        <div className={styles.backends} aria-label="配送先Backend">
          <p className={styles.panelLabel}>3 · DESTINATION</p>
          {(Object.keys(backendLabels) as BackendId[]).map((backend) => {
            const selected = state.destination === backend;
            return (
              <div key={backend} className={`${styles.backend} ${selected ? styles.selectedBackend : ""}`}>
                <span className={styles.backendShape} aria-hidden="true">▣</span>
                <div><strong>{backendLabels[backend]}</strong><small>{selected ? (state.phase === "delivered" ? "DELIVERED" : "SELECTED") : "STANDBY"}</small></div>
              </div>
            );
          })}
          {state.phase === "no-match" && <div className={styles.noMatch}><strong>× NO MATCH</strong><span>配送先なし</span></div>}
        </div>
      </div>

      <div className={styles.statusBar} role="status" aria-live="polite">
        <span className={styles.statusIcon} aria-hidden="true">{state.phase === "no-match" ? "!" : "i"}</span>
        <div><strong>{phaseLabels[state.phase]}</strong><p>{state.explanation}</p></div>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
        <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
        <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        <p>入力と結果はすべて学習用の合成データです。実環境への通信や変更は行いません。</p>
      </div>

      <div className={styles.learningNote}>
        <p className={styles.panelLabel}>WHY TRAFFIC &amp; ROUTING?</p>
        <p>このテンプレートの中心は、RequestのHost / Pathを評価して通信の配送先を選ぶことです。そのため主カテゴリは、セキュリティ検査やDNS設定ではなく <strong>Traffic &amp; Routing</strong> です。</p>
      </div>
    </section>
  );
}

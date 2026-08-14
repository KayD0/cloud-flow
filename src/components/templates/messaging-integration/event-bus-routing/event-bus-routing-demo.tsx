"use client";

import { useEffect, useReducer } from "react";
import {
  EVENT_TYPES, PRIORITIES, REGIONS, RULE_IDS, eventBusRoutingReducer, initialEventBusRoutingState,
  type ConsumerId, type EventAttributes, type EventPriority, type EventRegion, type EventType, type RuleId,
} from "@/lib/scenarios/messaging-integration/event-bus-routing/event-bus-routing-scenario";
import styles from "./event-bus-routing-demo.module.css";

const STATE_LABELS = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;
const PHASE_LABELS = { producer: "Producer", bus: "Event Bus", evaluation: "Rule evaluation", delivery: "Consumer delivery", unmatched: "No matching Rule", completed: "Completed" } as const;
const RULES: Record<RuleId, { name: string; condition: string; consumer: ConsumerId }> = {
  order: { name: "Order events", condition: "type = order.created", consumer: "order-processor" },
  priority: { name: "High priority", condition: "priority = high", consumer: "priority-monitor" },
  east: { name: "East region", condition: "region = east", consumer: "east-analytics" },
};
const CONSUMERS: Record<ConsumerId, string> = { "order-processor": "Order Processor", "priority-monitor": "Priority Monitor", "east-analytics": "East Analytics" };

function explanation(state: typeof initialEventBusRoutingState) {
  if (state.playback === "idle") return `${state.queue.length}件の合成イベントが待機中です。属性とRuleを確認してStartしてください。`;
  if (state.playback === "paused") return `${PHASE_LABELS[state.phase]}で一時停止しています。`;
  if (state.playback === "completed") return `${state.processedCount}件のイベント処理が完了しました。属性を変えてイベントを投入すると再試行できます。`;
  if (state.phase === "evaluation") return "有効なRuleだけがイベント属性を評価します。複数のRuleが一致すれば複数のConsumerへ配送します。";
  if (state.phase === "unmatched") return "有効なRuleに一致しないため配送されません。Ruleの有効状態または属性を変えて比較できます。";
  if (state.phase === "delivery") return `${state.delivered.map((id) => CONSUMERS[id]).join("、")}へ非同期配送しています。`;
  return `${PHASE_LABELS[state.phase]}をイベントが通過しています。`;
}

export function EventBusRoutingDemo() {
  const [state, dispatch] = useReducer(eventBusRoutingReducer, initialEventBusRoutingState);
  const active = state.activeEvent;
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 750);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  const setAttribute = (attribute: keyof EventAttributes, value: string) => dispatch({ type: "set-attribute", attribute, value });

  return (
    <section className={styles.demo} aria-labelledby="event-bus-demo-title">
      <div className={styles.demoHeader}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p><h2 id="event-bus-demo-title">Event Bus Routing</h2><p className={styles.intro}>Producer → Event Bus → Rule evaluation → Consumer の判断経路を追跡します。</p></div>
        <div className={styles.currentState} data-state={state.playback}><span>CURRENT STATE</span><strong>{STATE_LABELS[state.playback]}</strong></div>
      </div>

      <div className={styles.phaseMessage} aria-live="polite"><strong>{PHASE_LABELS[state.phase]}</strong><span>{explanation(state)}</span></div>

      <div className={styles.flow} aria-label="イベント配送フロー">
        <article className={`${styles.node} ${state.phase === "producer" && state.playback === "running" ? styles.active : ""}`}><span className={styles.step}>01 · SOURCE</span><strong>Producer</strong><small>{active ? `event-${active.id}` : "synthetic event"}</small></article>
        <span className={styles.arrow} aria-hidden="true">→</span>
        <article className={`${styles.node} ${styles.bus} ${state.phase === "bus" ? styles.active : ""}`}><span className={styles.step}>02 · ASYNC</span><strong>Event Bus</strong><small>queue {state.queue.length}</small></article>
        <span className={styles.arrow} aria-hidden="true">→</span>
        <article className={`${styles.node} ${styles.rulesNode} ${state.phase === "evaluation" ? styles.active : ""}`}><span className={styles.step}>03 · DECIDE</span><strong>Rule evaluation</strong><small>{state.evaluations.filter((item) => item.matched).length} matched</small></article>
        <span className={`${styles.arrow} ${styles.branch}`} aria-hidden="true">⇢</span>
        <div className={styles.consumers}>
          {(Object.entries(CONSUMERS) as [ConsumerId, string][]).map(([id, label]) => <article key={id} className={`${styles.consumer} ${state.phase === "delivery" && state.delivered.includes(id) ? styles.delivered : ""}`}><strong>{label}</strong><small>{state.delivered.includes(id) ? "DELIVERED ●" : "WAITING ○"}</small></article>)}
          <article className={`${styles.consumer} ${styles.unmatched} ${state.phase === "unmatched" ? styles.rejected : ""}`}><strong>Unmatched</strong><small>{state.phase === "unmatched" ? "NOT DELIVERED ×" : "BOUNDARY CASE"}</small></article>
        </div>
      </div>

      <div className={styles.workbench}>
        <fieldset className={styles.attributes}><legend>Event attributes</legend>
          <label><span>type</span><select aria-label="イベント種別" value={state.draft.type} onChange={(event) => setAttribute("type", event.target.value as EventType)}>{EVENT_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>priority</span><select aria-label="イベント優先度" value={state.draft.priority} onChange={(event) => setAttribute("priority", event.target.value as EventPriority)}>{PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>region</span><select aria-label="イベント地域" value={state.draft.region} onChange={(event) => setAttribute("region", event.target.value as EventRegion)}>{REGIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <button type="button" className={styles.inject} onClick={() => dispatch({ type: "inject" })}>＋ Eventを投入</button>
        </fieldset>
        <fieldset className={styles.ruleControls}><legend>Rules</legend>
          {RULE_IDS.map((ruleId) => <label key={ruleId} className={styles.ruleToggle}><input type="checkbox" checked={state.enabledRules[ruleId]} onChange={() => dispatch({ type: "toggle-rule", ruleId })} /><span><strong>{RULES[ruleId].name}</strong><small>{RULES[ruleId].condition} → {CONSUMERS[RULES[ruleId].consumer]}</small></span><b>{state.enabledRules[ruleId] ? "ENABLED" : "DISABLED"}</b></label>)}
        </fieldset>
      </div>

      <div className={styles.trace}>
        <h3>Rule trace</h3>
        {state.evaluations.length === 0 ? <p>イベントがRule evaluationへ到着すると、ここに判断理由を表示します。</p> : <ul>{state.evaluations.map((result) => <li key={result.ruleId} data-result={result.matched ? "match" : "skip"}><strong>{result.matched ? "MATCH ✓" : "SKIP —"}</strong><span>{RULES[result.ruleId].name}: {result.reason}</span></li>)}</ul>}
      </div>

      <div className={styles.footer}>
        <div className={styles.transport} aria-label="Event Bus Routing 操作"><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || (state.queue.length === 0 && !state.activeEvent)}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <p><strong>Why Messaging &amp; Integration?</strong> 送信元と受信先を疎結合にし、イベント内容に基づく非同期配送を扱うことが中心だからです。すべて説明用の合成データで、実環境には接続しません。</p>
      </div>
    </section>
  );
}

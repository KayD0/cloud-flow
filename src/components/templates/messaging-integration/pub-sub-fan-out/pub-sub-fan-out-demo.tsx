"use client";

import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import {
  FAN_OUT_STAGES,
  SUBSCRIBER_IDS,
  initialPubSubFanOutState,
  pubSubFanOutReducer,
  type DeliveryState,
  type SubscriberId,
} from "@/lib/scenarios/messaging-integration/pub-sub-fan-out/pub-sub-fan-out-scenario";
import styles from "./pub-sub-fan-out-demo.module.css";

const PLAYBACK_LABELS = {
  idle: "READY", published: "PUBLISHED", running: "DELIVERING", paused: "PAUSED", completed: "COMPLETED",
} as const;

const DELIVERY_LABELS: Record<DeliveryState, string> = {
  waiting: "WAITING",
  "in-transit": "IN TRANSIT",
  delivered: "DELIVERED",
  "subscription-disabled": "NOT SUBSCRIBED",
  "subscriber-stopped": "DELIVERY FAILED",
};

const SUBSCRIBERS: Record<SubscriberId, { label: string; y: number }> = {
  a: { label: "Subscriber A", y: 70 },
  b: { label: "Subscriber B", y: 210 },
  c: { label: "Subscriber C", y: 350 },
};

export function PubSubFanOutDemo() {
  const [state, dispatch] = useReducer(pubSubFanOutReducer, initialPubSubFanOutState, (initial) =>
    pubSubFanOutReducer(pubSubFanOutReducer(initial, { type: "publish" }), { type: "start" }),
  );
  const stage = FAN_OUT_STAGES[state.stageIndex];
  const settingsLocked = state.playback === "running" || state.playback === "completed";

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearTimeout(timer);
  }, [state.playback, state.stageIndex]);
  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "publish" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="fan-out-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="fan-out-demo-title">Pub/Sub Fan-out</h2>
          <p className={styles.description}>1件の合成メッセージが Topic から3つの独立した購読へ分岐する流れです。</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[state.playback]}`} aria-live="polite">
          <span>CURRENT STATE</span><strong>{PLAYBACK_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.statePanel} aria-live="polite">
        <div><span>STEP {state.stageIndex + 1} / {FAN_OUT_STAGES.length}</span><strong>{stage.label}</strong></div>
        <p>{stage.detail}</p>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 940 430" role="img" aria-labelledby="fan-out-title fan-out-desc">
          <title id="fan-out-title">Publisher、Topic、Subscriber A・B・C の Pub/Sub Fan-out</title>
          <desc id="fan-out-desc">PublisherからTopicへの実線と、Topicから3つのSubscriberへ分岐する線。無効な購読は点線、停止中は終端記号で示されます。</desc>
          <defs>
            <marker id="fan-out-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10z" />
            </marker>
          </defs>
          <path className={styles.publishPath} d="M175 210 H365" />
          <text className={styles.pathLabel} x="270" y="190" textAnchor="middle">PUBLISH · ONE MESSAGE</text>
          {SUBSCRIBER_IDS.map((id) => {
            const subscriber = state.subscribers[id];
            const target = SUBSCRIBERS[id];
            const pathClass = !subscriber.subscriptionEnabled ? styles.disabledPath : subscriber.stopped ? styles.stoppedPath : styles.deliveryPath;
            return (
              <g key={id}>
                <path className={pathClass} d={`M515 210 C610 210 610 ${target.y} 720 ${target.y}`} />
                <text className={styles.branchLabel} x="625" y={target.y - 10} textAnchor="middle">
                  {!subscriber.subscriptionEnabled ? "SUBSCRIPTION OFF" : subscriber.stopped ? "SUBSCRIBER STOPPED" : `SUBSCRIPTION ${id.toUpperCase()}`}
                </text>
                {state.stageIndex >= 2 && subscriber.subscriptionEnabled && !subscriber.stopped && (
                  <circle className={styles.deliveryToken} cx={state.stageIndex === 2 ? 615 : 705} cy={target.y} r="8" aria-hidden="true" />
                )}
              </g>
            );
          })}
          <g className={styles.publisher} transform="translate(45 165)">
            <rect width="130" height="90" rx="18" /><text x="65" y="40" textAnchor="middle">Publisher</text><text className={styles.nodeState} x="65" y="64" textAnchor="middle">MSG-{state.messageId}</text>
          </g>
          <g className={styles.topic} transform="translate(365 145)">
            <path d="M75 0 L150 35 V95 L75 130 L0 95 V35z" /><text x="75" y="58" textAnchor="middle">Topic</text><text className={styles.nodeState} x="75" y="82" textAnchor="middle">FAN-OUT HUB</text>
          </g>
          {SUBSCRIBER_IDS.map((id) => {
            const subscriber = state.subscribers[id];
            const target = SUBSCRIBERS[id];
            return (
              <g key={id} className={`${styles.subscriber} ${subscriber.stopped ? styles.stoppedNode : ""}`} transform={`translate(720 ${target.y - 45})`}>
                <rect width="170" height="90" rx={id === "b" ? 6 : 18} />
                <text x="85" y="35" textAnchor="middle">{target.label}</text>
                <text className={styles.nodeState} x="85" y="60" textAnchor="middle">{DELIVERY_LABELS[subscriber.delivery]}</text>
                <text className={styles.symbol} x="148" y="22" textAnchor="middle">{subscriber.stopped ? "■" : subscriber.subscriptionEnabled ? "●" : "○"}</text>
              </g>
            );
          })}
          {state.stageIndex === 0 && <rect className={styles.publishToken} x="100" y="205" width="14" height="14" rx="2" aria-hidden="true" />}
          {state.stageIndex === 1 && <rect className={styles.publishToken} x="430" y="203" width="14" height="14" rx="2" aria-hidden="true" />}
        </svg>
      </div>

      <ol className={styles.timeline} aria-label="fan-out の状態遷移">
        {FAN_OUT_STAGES.map((item, index) => (
          <li key={item.id} className={index === state.stageIndex ? styles.current : index < state.stageIndex ? styles.visited : ""} aria-current={index === state.stageIndex ? "step" : undefined}>
            <span>{index + 1}</span><small>{item.label}</small>
          </li>
        ))}
      </ol>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "publish" })} disabled={state.playback !== "idle"}>↑ Publish</button>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback !== "published" && state.playback !== "paused"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <p>Publish は Topic まで、Start は Topic からの配送を進めます。</p>
      </div>

      <div className={styles.subscriberControls}>
        <div className={styles.controlHeading}>
          <div><p>DELIVERY CONDITIONS</p><strong>購読と Subscriber の状態</strong></div>
          <span>配送中と完了後は Reset するまで固定されます。</span>
        </div>
        <div className={styles.controlGrid}>
          {SUBSCRIBER_IDS.map((id) => (
            <fieldset key={id}>
              <legend>{SUBSCRIBERS[id].label}</legend>
              <label><input type="checkbox" checked={state.subscribers[id].subscriptionEnabled} onChange={(event) => dispatch({ type: "set-subscription", subscriberId: id, enabled: event.target.checked })} disabled={settingsLocked} /> 購読を有効化</label>
              <label><input type="checkbox" checked={state.subscribers[id].stopped} onChange={(event) => dispatch({ type: "set-stopped", subscriberId: id, stopped: event.target.checked })} disabled={settingsLocked} /> Subscriber を停止</label>
            </fieldset>
          ))}
        </div>
      </div>

      <aside className={styles.learningNote} aria-label="カテゴリとシナリオの説明">
        <div><strong>Why Messaging &amp; Integration?</strong><p>主題は送信元と受信先を直接結ばず、Topic と購読を介して1件のメッセージを複数の処理へ連携することだからです。</p></div>
        <div><strong>Boundary case</strong><p>購読無効は配送対象外、Subscriber 停止は配送先が利用不能という異なる判断です。色に加えて線種、記号、状態名で区別します。</p></div>
        <div><strong>Safe learning environment</strong><p>メッセージ、状態、所要時間はすべて説明用の合成データです。実 Broker、実クラウド、管理 API へ接続せず、性能・可用性・安全性を保証しません。</p></div>
      </aside>
    </section>
  );
}

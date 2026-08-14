"use client";

import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import { getConsumerLag, getStateExplanation, initialStreamConsumerLagState, streamConsumerLagReducer, type ConsumerId } from "@/lib/scenarios/messaging-integration/stream-consumer-lag/stream-consumer-lag-scenario";
import styles from "./stream-consumer-lag-demo.module.css";

const playbackLabels = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;

export function StreamConsumerLagDemo() {
  const [state, dispatch] = useReducer(streamConsumerLagReducer, initialStreamConsumerLagState, (initial) => streamConsumerLagReducer(initial, { type: "start" }));
  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 700);
    return () => window.clearInterval(timer);
  }, [state.playback]);
  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  const lagA = getConsumerLag(state, "a");
  const lagB = getConsumerLag(state, "b");
  const position = (cursor: number) => `${Math.max(2, Math.min(98, (cursor / Math.max(state.streamOffset, 1)) * 100))}%`;
  const toggleConsumer = (consumer: ConsumerId) => {
    const active = consumer === "a" ? state.consumerAActive : state.consumerBActive;
    dispatch({ type: "set-consumer-active", consumer, active: !active });
  };

  return (
    <section className={styles.demo} aria-labelledby="stream-lag-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 34</p><h2 id="stream-lag-title">Follow two consumers through one stream</h2><p className={styles.description}>発行量と処理量の差が、独立した cursor と Lag にどう現れるかを合成データで観察します。</p></div>
        <div className={styles.stateBadge} data-state={state.playback} aria-live="polite"><span>CURRENT STATE</span><strong>{playbackLabels[state.playback]}</strong><small>step {state.tick} / 12</small></div>
      </header>

      <div className={styles.status} role="status"><strong>WHAT IS HAPPENING?</strong><span>{getStateExplanation(state)}</span></div>

      <div className={styles.canvas} aria-label="Producer から Stream、Consumer cursor A と B への流れ">
        <div className={styles.producer}><span>PRODUCER</span><strong>Event publisher</strong><small>{state.publishRate} messages / step</small></div>
        <div className={styles.flowArrow}><span>APPEND</span><b aria-hidden="true">→</b></div>
        <div className={styles.streamPanel}>
          <div className={styles.streamHeading}><span>APPEND-ONLY STREAM</span><strong>latest offset {state.streamOffset}</strong></div>
          <div className={styles.streamTrack}>
            <span className={styles.segment} /><span className={styles.segment} /><span className={styles.segment} /><span className={styles.segment} /><span className={styles.head}>HEAD</span>
            <span className={`${styles.cursor} ${styles.cursorA}`} style={{ left: position(state.cursorA) }}><b>A</b><small>offset {state.cursorA}</small></span>
            <span className={`${styles.cursor} ${styles.cursorB}`} style={{ left: position(state.cursorB) }}><b>B</b><small>offset {state.cursorB}</small></span>
          </div>
          <div className={styles.legend}><span><i className={styles.solid} /> cursor A</span><span><i className={styles.dashed} /> cursor B</span><span>▶ stream head</span></div>
        </div>
        <div className={styles.consumers}>
          <ConsumerCard id="A" active={state.consumerAActive} rate={state.consumerRateA} lag={lagA} cursor={state.cursorA} onToggle={() => toggleConsumer("a")} />
          <ConsumerCard id="B" active={state.consumerBActive} rate={state.consumerRateB} lag={lagB} cursor={state.cursorB} onToggle={() => toggleConsumer("b")} />
        </div>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
        <RateControl label="発行量" value={state.publishRate} onChange={(rate) => dispatch({ type: "set-publish-rate", rate })} />
        <RateControl label="Consumer A 処理量" value={state.consumerRateA} onChange={(rate) => dispatch({ type: "set-consumer-rate", consumer: "a", rate })} />
        <RateControl label="Consumer B 処理量" value={state.consumerRateB} onChange={(rate) => dispatch({ type: "set-consumer-rate", consumer: "b", rate })} />
      </div>

      <footer className={styles.note}><strong>なぜ Messaging &amp; Integration?</strong><span>中心となる判断が、Producer と Consumer 間の非同期メッセージ連携、読み取り位置、処理速度の差だからです。値と時間は学習用の合成表現で、実環境・性能・可用性・安全性を示すものではありません。</span></footer>
    </section>
  );
}

function ConsumerCard({ id, active, rate, lag, cursor, onToggle }: { id: "A" | "B"; active: boolean; rate: number; lag: number; cursor: number; onToggle: () => void }) {
  return <article className={styles.consumerCard} data-active={active} data-consumer={id.toLowerCase()}><div><span>CONSUMER {id}</span><strong>{active ? "RUNNING" : "STOPPED"}</strong></div><dl><div><dt>cursor</dt><dd>{cursor}</dd></div><div><dt>process</dt><dd>{active ? rate : 0}/step</dd></div><div><dt>Lag</dt><dd>{lag}</dd></div></dl><button type="button" onClick={onToggle}>{active ? `Stop Consumer ${id}` : `Resume Consumer ${id}`}</button></article>;
}

function RateControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className={styles.rate}><span>{label}<output>{value} / step</output></span><input type="range" min="0" max="12" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

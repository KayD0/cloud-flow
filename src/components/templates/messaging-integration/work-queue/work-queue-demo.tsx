"use client";
import { useEffect, useReducer } from "react";
import { useTemplateLoop } from "@/components/templates/use-template-loop";
import { initialWorkQueueState, workQueueReducer, type ConsumerId } from "@/lib/scenarios/messaging-integration/work-queue/work-queue-scenario";
import styles from "./work-queue-demo.module.css";

const LABELS = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;
export function WorkQueueDemo() {
  const [state, dispatch] = useReducer(workQueueReducer, initialWorkQueueState, (initial) => workQueueReducer(initial, { type: "start" }));
  const stopped = !state.consumers.a && !state.consumers.b;
  const status = stopped && state.playback === "running" ? "BACKLOG" : LABELS[state.playback];
  const explanation = state.playback === "idle" ? "合成Messageを発行し、稼働中のConsumerが競合して1件ずつ受け取る準備ができています。"
    : state.playback === "paused" ? `シナリオを一時停止しました。Queueには${state.queued}件残っています。`
      : state.playback === "completed" ? `${state.published}件をすべて処理し、Queueは空になりました。`
        : stopped ? `Consumerが両方停止中です。${state.queued}件のbacklogは復旧するまで配送されません。`
          : `${state.published}/${state.publicationVolume}件を発行済み。Queue ${state.queued}件を稼働中のConsumerへ配送しています。`;

  useEffect(() => { if (state.playback !== "running") return; const timer = window.setInterval(() => dispatch({ type: "tick" }), 650); return () => window.clearInterval(timer); }, [state.playback]);
  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });
  const toggle = (consumer: ConsumerId) => dispatch({ type: "toggle-consumer", consumer });
  return <section className={styles.demo} aria-labelledby="work-queue-title">
    <div className={styles.header}><div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p><h2 id="work-queue-title">Work Queue</h2><p>Producer → Queue → Consumer A / B の蓄積・競合配送・処理を観察します。</p></div><div className={styles.badge} data-state={status}><span>CURRENT STATE</span><strong>{status}</strong></div></div>
    <div className={styles.status} aria-live="polite"><strong>{status}</strong><span>{explanation}</span></div>
    <div className={styles.canvasWrap}><svg className={styles.canvas} viewBox="0 0 920 450" role="img" aria-labelledby="work-queue-svg-title work-queue-svg-desc"><title id="work-queue-svg-title">Work QueueのMessage配送</title><desc id="work-queue-svg-desc">ProducerからQueueへ発行し、実線でConsumer A、破線でConsumer Bへ競合配送する合成Messageの流れ</desc><defs><marker id="queue-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" /></marker></defs>
      <g className={styles.connections}><path d="M190 225H335" /><path className={!state.consumers.a ? styles.stoppedPath : ""} d="M535 205L690 125" /><path className={`${styles.pathB} ${!state.consumers.b ? styles.stoppedPath : ""}`} d="M535 245L690 325" /></g>
      <g className={styles.node} transform="translate(45 175)"><rect width="145" height="100" rx="18"/><text x="72" y="42" textAnchor="middle" className={styles.icon}>P</text><text x="72" y="68" textAnchor="middle">Producer</text><text x="72" y="87" textAnchor="middle" className={styles.micro}>{state.published} / {state.publicationVolume} PUBLISHED</text></g>
      <g className={`${styles.node} ${styles.queue}`} transform="translate(335 155)"><rect width="200" height="140" rx="12"/><text x="100" y="35" textAnchor="middle">Queue</text><text x="100" y="60" textAnchor="middle" className={styles.micro}>BACKLOG {state.queued}</text>{Array.from({ length: Math.min(state.queued, 8) }, (_, i) => i % 2 === 0 ? <circle key={i} cx={43 + (i % 4) * 38} cy={88 + Math.floor(i / 4) * 30} r="8" className={styles.message}/> : <rect key={i} x={35 + (i % 4) * 38} y={80 + Math.floor(i / 4) * 30} width="16" height="16" className={styles.message}/>)}</g>
      {(["a", "b"] as const).map((id) => <g key={id} className={`${styles.node} ${styles.consumer} ${!state.consumers[id] ? styles.stopped : ""}`} transform={`translate(690 ${id === "a" ? 70 : 270})`}><rect width="170" height="110" rx={id === "a" ? 18 : 5}/><text x="85" y="38" textAnchor="middle">Consumer {id.toUpperCase()}</text><text x="85" y="64" textAnchor="middle" className={styles.micro}>{state.consumers[id] ? "RUNNING" : "STOPPED"}</text><text x="85" y="88" textAnchor="middle" className={styles.count}>{state.processed[id]} PROCESSED</text></g>)}
      <g className={styles.legend}><circle cx="355" cy="405" r="6"/><text x="369" y="409">MESSAGE TYPE 1</text><rect x="510" y="399" width="12" height="12"/><text x="530" y="409">MESSAGE TYPE 2</text><text x="670" y="409">SOLID: A　DASHED: B</text></g>
    </svg></div>
    <div className={styles.controls} aria-label="Work Queue操作"><div className={styles.transport}><button onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button><button onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
      <label><span>発行量 <output>{state.publicationVolume}</output></span><input aria-label="Message発行量" type="range" min="8" max="40" step="2" value={state.publicationVolume} disabled={state.playback !== "idle"} onChange={(e) => dispatch({ type: "set-publication-volume", value: Number(e.target.value) })}/></label>
      <label><span>処理量 / Consumer <output>{state.processingAmount}</output></span><input aria-label="Consumerごとの処理量" type="range" min="1" max="4" value={state.processingAmount} onChange={(e) => dispatch({ type: "set-processing-amount", value: Number(e.target.value) })}/></label>
      <div className={styles.consumerControls}>{(["a", "b"] as const).map((id) => <button key={id} aria-pressed={!state.consumers[id]} onClick={() => toggle(id)}>Consumer {id.toUpperCase()}：{state.consumers[id] ? "停止" : "復旧"}</button>)}</div>
    </div>
    <div className={styles.results}><div><span>PUBLISHED</span><strong>{state.published}</strong></div><div><span>QUEUED</span><strong>{state.queued}</strong></div><div><span>CONSUMER A</span><strong>● {state.processed.a}</strong></div><div><span>CONSUMER B</span><strong>◆ {state.processed.b}</strong></div><p><strong>Why Messaging &amp; Integration?</strong> Producerと処理担当をQueueで疎結合にし、Messageの蓄積と競合配送を扱うことが中心だからです。値と時間は説明用の合成データで、実環境には接続しません。</p></div>
  </section>;
}

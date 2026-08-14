"use client";

import { useEffect, useReducer } from "react";
import {
  initialWeightedRoutingState,
  weightedRoutingReducer,
  type Destination,
  type WeightedRequest,
} from "@/lib/scenarios/traffic-routing/weighted-routing/weighted-routing-scenario";
import styles from "./weighted-routing-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const TARGETS: Record<Destination, { x: number; y: number }> = {
  stable: { x: 760, y: 135 },
  canary: { x: 760, y: 345 },
};

const STATE_LABELS = {
  idle: "READY",
  running: "ROUTING",
  paused: "PAUSED",
  completed: "COMPLETED",
} as const;

function requestPosition(request: WeightedRequest) {
  const client = { x: 110, y: 240 };
  const router = { x: 420, y: 240 };
  const target = TARGETS[request.target];
  if (request.progress <= 0.45) {
    const ratio = request.progress / 0.45;
    return { x: client.x + (router.x - client.x) * ratio, y: client.y };
  }
  const ratio = (request.progress - 0.45) / 0.55;
  return {
    x: router.x + (target.x - router.x) * ratio,
    y: router.y + (target.y - router.y) * ratio,
  };
}

export function WeightedRoutingDemo() {
  const [state, dispatch] = useReducer(weightedRoutingReducer, initialWeightedRoutingState, (initial) => weightedRoutingReducer(initial, { type: "start" }));
  const totalWeight = state.weights.stable + state.weights.canary;
  const stableRatio = totalWeight === 0 ? 0 : Math.round((state.weights.stable / totalWeight) * 100);
  const canaryRatio = totalWeight === 0 ? 0 : 100 - stableRatio;
  const completedTotal = state.completed.stable + state.completed.canary;
  const explanation = totalWeight === 0
    ? "配送先を決められません。少なくとも一方の重みを1以上にしてください。"
    : state.playback === "idle"
      ? `合成リクエストを Stable ${stableRatio}% / Canary ${canaryRatio}% の目安で配送する準備ができています。`
      : state.playback === "paused"
        ? "配送を一時停止しています。重みを変更してから再開すると、次のリクエストから新しい比率が使われます。"
        : state.playback === "completed"
          ? `${state.requestCount}件の合成リクエストを配送しました。少数の試行では結果が重みと完全一致しない場合があります。`
          : `${state.dispatchedRequests}/${state.requestCount}件をRouterが重みに基づいて振り分けています。`;

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 300);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="weighted-demo-title">
      <div className={styles.demoHeader}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="weighted-demo-title">Weighted Routing</h2>
          <p className={styles.description}>Client → Router → Stable / Canary の経路で、段階的リリースの配送比率を観察します。</p>
        </div>
        <div className={styles.stateBadge} data-state={state.playback}>
          <span>CURRENT STATE</span>
          <strong>{STATE_LABELS[state.playback]}</strong>
        </div>
      </div>

      <div className={styles.statusPanel} aria-live="polite">
        <strong>{STATE_LABELS[state.playback]}</strong>
        <span>{explanation}</span>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 900 480" role="img" aria-labelledby="weighted-canvas-title weighted-canvas-desc">
          <title id="weighted-canvas-title">Weighted Routing request flow</title>
          <desc id="weighted-canvas-desc">ClientからRouterを経由し、実線のStableまたは破線のCanaryへ向かう合成リクエスト</desc>
          <defs>
            <marker id="weighted-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 10 5 0 10z" />
            </marker>
          </defs>
          <g className={styles.connections}>
            <path d="M165 240H350" />
            <path className={styles.stablePath} d="M490 240L695 135" />
            <path className={styles.canaryPath} d="M490 240L695 345" />
          </g>
          <g className={styles.node} transform="translate(55 195)">
            <rect width="110" height="90" rx="18" />
            <text x="55" y="42" textAnchor="middle" className={styles.nodeIcon}>↗</text>
            <text x="55" y="68" textAnchor="middle">Client</text>
          </g>
          <g className={`${styles.node} ${styles.router}`} transform="translate(350 185)">
            <rect width="140" height="110" rx="22" />
            <text x="70" y="45" textAnchor="middle" className={styles.nodeIcon}>⇄</text>
            <text x="70" y="74" textAnchor="middle">Router</text>
            <text x="70" y="94" textAnchor="middle" className={styles.microLabel}>WEIGHTED</text>
          </g>
          {(["stable", "canary"] as const).map((destination) => {
            const target = TARGETS[destination];
            const label = destination === "stable" ? "Stable" : "Canary";
            return (
              <g key={destination} className={`${styles.node} ${styles[destination]}`} transform={`translate(${target.x - 65} ${target.y - 48})`}>
                <rect width="130" height="96" rx={destination === "stable" ? 18 : 5} />
                <text x="65" y="38" textAnchor="middle">{label}</text>
                <text x="65" y="61" textAnchor="middle" className={styles.weightLabel}>{state.weights[destination]} weight</text>
                <text x="65" y="80" textAnchor="middle" className={styles.countLabel}>{state.completed[destination]} delivered</text>
              </g>
            );
          })}
          <g className={styles.requests} aria-hidden="true">
            {state.requests.map((request) => {
              const position = requestPosition(request);
              return request.target === "stable"
                ? <circle key={request.id} className={styles.stableRequest} cx={position.x} cy={position.y} r="7" />
                : <rect key={request.id} className={styles.canaryRequest} x={position.x - 6} y={position.y - 6} width="12" height="12" transform={`rotate(45 ${position.x} ${position.y})`} />;
            })}
          </g>
        </svg>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed" || totalWeight === 0}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <label>
          <span>Stable weight <output>{state.weights.stable} ({stableRatio}%)</output></span>
          <input aria-label="Stableの重み" type="range" min="0" max="100" value={state.weights.stable} onChange={(event) => dispatch({ type: "set-weight", destination: "stable", weight: Number(event.target.value) })} />
        </label>
        <label>
          <span>Canary weight <output>{state.weights.canary} ({canaryRatio}%)</output></span>
          <input aria-label="Canaryの重み" type="range" min="0" max="100" value={state.weights.canary} onChange={(event) => dispatch({ type: "set-weight", destination: "canary", weight: Number(event.target.value) })} />
        </label>
        <label>
          <span>Request count <output>{state.requestCount}</output></span>
          <input aria-label="Request数" type="range" min="5" max="100" step="5" value={state.requestCount} disabled={state.playback !== "idle"} onChange={(event) => dispatch({ type: "set-request-count", requestCount: Number(event.target.value) })} />
        </label>
      </div>

      <div className={styles.results}>
        <div><span>PROGRESS</span><strong>{completedTotal} / {state.requestCount}</strong></div>
        <div><span>STABLE</span><strong>● {state.completed.stable}</strong></div>
        <div><span>CANARY</span><strong>◆ {state.completed.canary}</strong></div>
        <p>Traffic &amp; Routing は「どの経路へ、どの比率で送るか」が中心課題です。このデモは実環境に接続せず、説明用の合成データだけを使います。</p>
      </div>
    </section>
  );
}

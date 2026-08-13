"use client";

import { useEffect, useReducer } from "react";
import {
  initialLoadBalancerState,
  loadBalancerReducer,
  SERVER_IDS,
  type LoadBalancerState,
  type RequestToken,
  type ServerId,
} from "@/lib/scenarios/traffic-routing/round-robin-load-balancing/load-balancer-scenario";
import styles from "./load-balancer-demo.module.css";

const SERVER_COORDINATES: Record<ServerId, { x: number; y: number }> = {
  "server-a": { x: 760, y: 110 },
  "server-b": { x: 760, y: 250 },
  "server-c": { x: 760, y: 390 },
};

const SERVER_LABELS: Record<ServerId, string> = {
  "server-a": "Backend A",
  "server-b": "Backend B",
  "server-c": "Backend C",
};

const STATUS_LABELS = {
  healthy: "HEALTHY",
  processing: "RECEIVING",
  down: "DOWN / EXCLUDED",
} as const;

function requestPosition(request: RequestToken) {
  const client = { x: 115, y: 250 };
  const loadBalancer = { x: 430, y: 250 };
  const server = SERVER_COORDINATES[request.target];
  if (request.progress <= 0.45) {
    const ratio = request.progress / 0.45;
    return { x: client.x + (loadBalancer.x - client.x) * ratio, y: client.y };
  }
  const ratio = (request.progress - 0.45) / 0.55;
  return {
    x: loadBalancer.x + (server.x - loadBalancer.x) * ratio,
    y: loadBalancer.y + (server.y - loadBalancer.y) * ratio,
  };
}

function getStateMessage(state: LoadBalancerState) {
  const healthyCount = SERVER_IDS.filter((id) => state.servers[id] !== "down").length;
  if (healthyCount === 0) {
    return "配送可能な Backend がありません。新しい Request は拒否されます。Backend を復旧すると配送を再開できます。";
  }
  if (state.playback === "idle") {
    return "初期状態です。3 台の正常な Backend を候補に、Backend A から順番に配送します。";
  }
  if (state.playback === "paused") {
    return `一時停止中です。進行中 ${state.requests.length} 件、完了 ${state.completedRequests} 件の状態を保持しています。`;
  }
  const excluded = SERVER_IDS.length - healthyCount;
  return excluded > 0
    ? `${healthyCount} 台へ順番に配送中です。停止中の ${excluded} 台は候補から除外されています。`
    : "3 台の Backend へ A → B → C の順で繰り返し配送しています。";
}

export function LoadBalancerDemo() {
  const [state, dispatch] = useReducer(loadBalancerReducer, initialLoadBalancerState, (initial) => loadBalancerReducer(initial, { type: "start" }));
  const stateMessage = getStateMessage(state);

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 650);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.demo} aria-labelledby="demo-title">
      <div className={styles.demoHeader}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="demo-title">Round Robin Load Balancing</h2>
          <p className={styles.description}>
            合成した Request が正常な Backend へ順番に配送されます。停止と復旧を試し、Load Balancer が配送先を選ぶ理由を確認できます。
          </p>
        </div>
        <dl className={styles.stats} aria-label="配送統計">
          <div><dt>COMPLETED</dt><dd>{state.completedRequests.toString().padStart(3, "0")}</dd></div>
          <div><dt>REJECTED</dt><dd>{state.rejectedRequests.toString().padStart(3, "0")}</dd></div>
        </dl>
      </div>

      <div className={styles.stateMessage} role="status" aria-live="polite">
        <span>{state.playback === "running" ? "RUNNING" : state.playback.toUpperCase()}</span>
        <p>{stateMessage}</p>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 900 500" role="img" aria-labelledby="canvas-title canvas-desc">
          <title id="canvas-title">Client から Load Balancer を経由して 3 台の Backend へ向かう Request</title>
          <desc id="canvas-desc">実線の入口経路と破線の配送経路上を丸い Request が移動します。停止した Backend は斜線と DOWN ラベルで示されます。</desc>
          <defs>
            <marker id="round-robin-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
            <pattern id="down-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" />
            </pattern>
          </defs>
          <g className={styles.connections}>
            <path className={styles.clientConnection} d="M165 250 H365" />
            {SERVER_IDS.map((serverId) => {
              const coordinate = SERVER_COORDINATES[serverId];
              const isDown = state.servers[serverId] === "down";
              return <path className={isDown ? styles.excludedConnection : undefined} key={serverId} d={`M495 250 L${coordinate.x - 65} ${coordinate.y}`} />;
            })}
          </g>
          <g className={styles.node} transform="translate(55 205)">
            <rect width="110" height="90" rx="18" />
            <text x="55" y="40" textAnchor="middle" className={styles.nodeSymbol}>●</text>
            <text x="55" y="68" textAnchor="middle">Client</text>
          </g>
          <g className={`${styles.node} ${styles.loadBalancer}`} transform="translate(365 195)">
            <rect width="130" height="110" rx="22" />
            <text x="65" y="40" textAnchor="middle" className={styles.nodeSymbol}>⇄</text>
            <text x="65" y="70" textAnchor="middle">Load Balancer</text>
            <text x="65" y="92" textAnchor="middle" className={styles.microLabel}>NEXT HEALTHY</text>
          </g>
          {SERVER_IDS.map((serverId) => {
            const coordinate = SERVER_COORDINATES[serverId];
            const status = state.servers[serverId];
            const statusLabel = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status.toUpperCase();
            return (
              <g key={serverId} className={`${styles.node} ${styles[status]}`} transform={`translate(${coordinate.x - 65} ${coordinate.y - 45})`}>
                <rect width="130" height="90" rx="18" />
                {status === "down" && <rect className={styles.downPattern} width="130" height="90" rx="18" />}
                <path className={styles.statusShape} d="M14 13 h10 v10 h-10 z" />
                <text x="65" y="42" textAnchor="middle">{SERVER_LABELS[serverId]}</text>
                <text x="65" y="65" textAnchor="middle" className={styles.statusText}>{statusLabel}</text>
              </g>
            );
          })}
          <g className={styles.requests} aria-hidden="true">
            {state.requests.map((request) => {
              const position = requestPosition(request);
              return <circle key={request.id} cx={position.x} cy={position.y} r="7" />;
            })}
          </g>
        </svg>
      </div>

      <div className={styles.legend} aria-label="図の凡例">
        <span><i className={styles.requestKey} /> Request</span>
        <span><i className={styles.healthyKey} /> Healthy</span>
        <span><i className={styles.receivingKey} /> Receiving</span>
        <span><i className={styles.downKey} /> Down / Excluded</span>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <label>
          <span>Speed <output>{state.speed.toFixed(1)}×</output></span>
          <input aria-label="再生速度" type="range" min="0.5" max="2" step="0.5" value={state.speed} onChange={(event) => dispatch({ type: "set-speed", speed: Number(event.target.value) })} />
        </label>
        <label>
          <span>Traffic <output>{state.traffic} req/tick</output></span>
          <input aria-label="トラフィック量" type="range" min="1" max="5" step="1" value={state.traffic} onChange={(event) => dispatch({ type: "set-traffic", traffic: Number(event.target.value) })} />
        </label>
      </div>

      <div className={styles.failures}>
        <p>BACKEND STATE</p>
        <div>
          {SERVER_IDS.map((serverId) => {
            const isDown = state.servers[serverId] === "down";
            return (
              <button key={serverId} type="button" aria-pressed={isDown} onClick={() => dispatch({ type: isDown ? "recover" : "fail", serverId })}>
                <span className={styles.failureSymbol} aria-hidden="true">{isDown ? "+" : "×"}</span>
                {isDown ? `${SERVER_LABELS[serverId]} を復旧` : `${SERVER_LABELS[serverId]} を停止`}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.learningNotes}>
        <article>
          <p className={styles.eyebrow}>STATE TRANSITIONS</p>
          <h3>何が起きるか</h3>
          <ol>
            <li><strong>初期:</strong> 3 台は Healthy。次の配送先は Backend A です。</li>
            <li><strong>実行:</strong> Request ごとに次の Healthy な Backend を選びます。</li>
            <li><strong>完了:</strong> Request が配送先へ到達すると Completed に加算されます。</li>
          </ol>
        </article>
        <article>
          <p className={styles.eyebrow}>WHY TRAFFIC &amp; ROUTING?</p>
          <h3>カテゴリの理由</h3>
          <p>中心となる学習対象が、処理能力そのものではなく「到着した通信をどの正常な宛先へ送るか」という経路選択だからです。</p>
          <p className={styles.disclaimer}>この画面は合成データだけを使う説明用シミュレーションです。実環境へ接続せず、性能や可用性を保証しません。</p>
        </article>
      </div>
    </section>
  );
}

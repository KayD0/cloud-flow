"use client";

import { useEffect, useReducer } from "react";
import {
  initialLoadBalancerState,
  loadBalancerReducer,
  SERVER_IDS,
  type RequestToken,
  type ServerId,
} from "@/lib/infrastructure/load-balancer-scenario";
import styles from "./load-balancer-demo.module.css";

const SERVER_COORDINATES: Record<ServerId, { x: number; y: number }> = {
  "server-a": { x: 760, y: 110 },
  "server-b": { x: 760, y: 250 },
  "server-c": { x: 760, y: 390 },
};

function requestPosition(request: RequestToken) {
  const client = { x: 115, y: 250 };
  const loadBalancer = { x: 430, y: 250 };
  const server = SERVER_COORDINATES[request.target];
  if (request.progress <= 0.45) {
    const ratio = request.progress / 0.45;
    return {
      x: client.x + (loadBalancer.x - client.x) * ratio,
      y: client.y,
    };
  }
  const ratio = (request.progress - 0.45) / 0.55;
  return {
    x: loadBalancer.x + (server.x - loadBalancer.x) * ratio,
    y: loadBalancer.y + (server.y - loadBalancer.y) * ratio,
  };
}

const labels: Record<ServerId, string> = {
  "server-a": "Server A",
  "server-b": "Server B",
  "server-c": "Server C",
};

export function LoadBalancerDemo() {
  const [state, dispatch] = useReducer(loadBalancerReducer, initialLoadBalancerState);

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
            リクエストが Healthy なサーバーへ順番に配送されます。障害を注入して経路の変化を確認できます。
          </p>
        </div>
        <div className={styles.liveStat} aria-live="polite">
          <span>COMPLETED</span>
          <strong>{state.completedRequests.toString().padStart(3, "0")}</strong>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 900 500" role="img" aria-labelledby="canvas-title canvas-desc">
          <title id="canvas-title">Load Balancer request flow</title>
          <desc id="canvas-desc">ClientからLoad Balancerを経由し、3台のServerへ向かうリクエスト</desc>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          <g className={styles.connections}>
            <path d="M165 250 H365" />
            {SERVER_IDS.map((serverId) => {
              const coordinate = SERVER_COORDINATES[serverId];
              return <path key={serverId} d={`M495 250 L${coordinate.x - 65} ${coordinate.y}`} />;
            })}
          </g>
          <g className={styles.node} transform="translate(55 205)">
            <rect width="110" height="90" rx="18" />
            <text x="55" y="42" textAnchor="middle" className={styles.nodeIcon}>↗</text>
            <text x="55" y="69" textAnchor="middle">Client</text>
          </g>
          <g className={`${styles.node} ${styles.loadBalancer}`} transform="translate(365 195)">
            <rect width="130" height="110" rx="22" />
            <text x="65" y="46" textAnchor="middle" className={styles.nodeIcon}>⇄</text>
            <text x="65" y="76" textAnchor="middle">Load Balancer</text>
            <text x="65" y="94" textAnchor="middle" className={styles.microLabel}>ROUND ROBIN</text>
          </g>
          {SERVER_IDS.map((serverId) => {
            const coordinate = SERVER_COORDINATES[serverId];
            const status = state.servers[serverId];
            return (
              <g key={serverId} className={`${styles.node} ${styles[status]}`} transform={`translate(${coordinate.x - 65} ${coordinate.y - 45})`}>
                <rect width="130" height="90" rx="18" />
                <circle cx="18" cy="18" r="5" className={styles.statusDot} />
                <text x="65" y="42" textAnchor="middle">{labels[serverId]}</text>
                <text x="65" y="64" textAnchor="middle" className={styles.statusText}>{status.toUpperCase()}</text>
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
          <input aria-label="Traffic量" type="range" min="1" max="5" value={state.traffic} onChange={(event) => dispatch({ type: "set-traffic", traffic: Number(event.target.value) })} />
        </label>
      </div>

      <div className={styles.failures}>
        <p>FAILURE INJECTION</p>
        <div>
          {SERVER_IDS.map((serverId) => {
            const isDown = state.servers[serverId] === "down";
            return (
              <button key={serverId} type="button" aria-pressed={isDown} onClick={() => dispatch({ type: isDown ? "recover" : "fail", serverId })}>
                <span className={styles.failureDot} /> {isDown ? `Recover ${labels[serverId]}` : `Fail ${labels[serverId]}`}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  advanceLoadBalancerScene,
  getActiveServer,
  getScenePhase,
  initialLoadBalancerState,
  type ScenePhase,
  type ServerId,
} from "@/lib/scenarios/traffic-routing/round-robin-load-balancing/load-balancer-scenario";
import styles from "./load-balancer-demo.module.css";

const SERVER_Y: Record<ServerId, number> = {
  "server-a": 105,
  "server-b": 250,
  "server-c": 395,
};

const PHASE_LABELS: Record<ScenePhase, { step: string; title: string; detail: string }> = {
  arrival: {
    step: "01 / ARRIVAL",
    title: "Request が到着",
    detail: "受信キューから Load Balancer へ、新しい Request を送ります。",
  },
  routing: {
    step: "02 / ROUTING",
    title: "次の Server を選択",
    detail: "Round Robin ポインターが順番どおりの Server を指します。",
  },
  processing: {
    step: "03 / PROCESSING",
    title: "Request を処理中",
    detail: "選ばれた Server だけが処理中になり、他は次の Request を待ちます。",
  },
  response: {
    step: "04 / RESPONSE",
    title: "Response を返却",
    detail: "処理済み Response が戻り、ポインターは次の Server へ進みます。",
  },
};

function tokenPosition(phase: ScenePhase, target: ServerId) {
  if (phase === "arrival") return { x: 176, y: 250 };
  if (phase === "routing") return { x: 468, y: 250 };
  if (phase === "processing") return { x: 758, y: SERVER_Y[target] };
  return { x: 176, y: 250 };
}

export function LoadBalancerDemo() {
  const [state, setState] = useState(initialLoadBalancerState);
  const phase = getScenePhase(state);
  const activeServer = getActiveServer(state);
  const phaseCopy = PHASE_LABELS[phase];
  const token = tokenPosition(phase, activeServer.id);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => advanceLoadBalancerScene(current));
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className={styles.scene} aria-labelledby="dealer-title" data-phase={phase}>
      <header className={styles.sceneHeader}>
        <div>
          <p className={styles.eyebrow}>TRAFFIC &amp; ROUTING · AUTO PLAY</p>
          <h2 id="dealer-title">ラウンドロビン・ディーラー</h2>
          <p className={styles.lead}>
            到着した Request を Server A、B、C へ順番に配り、処理と Response の循環を俯瞰します。
          </p>
        </div>
        <div className={styles.loopBadge} aria-label={`自動再生、周回 ${state.cycle}`}>
          <span className={styles.pulse} aria-hidden="true" />
          <span>AUTO LOOP</span>
          <strong>ROUND {String(state.cycle).padStart(2, "0")}</strong>
        </div>
      </header>

      <div className={styles.statusBar} aria-live="polite" aria-atomic="true">
        <span>{phaseCopy.step}</span>
        <strong>{phaseCopy.title}</strong>
        <p>{phaseCopy.detail}</p>
        <code>REQ-{String(state.requestNumber).padStart(3, "0")} → {activeServer.label}</code>
      </div>

      <div className={styles.playfield}>
        <div className={styles.board}>
          <svg viewBox="0 0 940 500" role="img" aria-labelledby="topology-title topology-description">
            <title id="topology-title">Round Robin Load Balancing の通信経路</title>
            <desc id="topology-description">
              Request Queue から Load Balancer を経由し、Server A、B、C へ順番に Request を配送して Response を返します。
            </desc>
            <defs>
              <marker id="request-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 10 5 0 10z" />
              </marker>
              <marker id="response-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 10 5 0 10z" />
              </marker>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" />
              </pattern>
            </defs>

            <rect className={styles.grid} width="940" height="500" rx="20" />
            <g className={styles.paths}>
              <path className={styles.requestPath} d="M178 250H398" />
              <path className={styles.responsePath} d="M398 276H178" />
              {(Object.entries(SERVER_Y) as [ServerId, number][]).map(([serverId, y]) => (
                <path
                  key={serverId}
                  className={serverId === activeServer.id ? styles.activePath : styles.serverPath}
                  d={`M538 250 C630 250 650 ${y} 730 ${y}`}
                />
              ))}
            </g>

            <g className={styles.queueNode} transform="translate(42 197)">
              <rect width="136" height="106" rx="16" />
              <path d="M28 37h80M28 53h62M28 69h45" />
              <text x="68" y="90" textAnchor="middle">REQUEST QUEUE</text>
            </g>

            <g className={styles.balancerNode} transform="translate(398 180)">
              <rect width="140" height="140" rx="24" />
              <circle cx="70" cy="54" r="25" />
              <path d="M70 36v36m-14-11 14 11 14-11" />
              <text x="70" y="104" textAnchor="middle">LOAD BALANCER</text>
              <text x="70" y="120" textAnchor="middle">ROUND ROBIN</text>
            </g>

            {state.servers.map((server) => {
              const isActive = server.id === activeServer.id;
              return (
                <g
                  key={server.id}
                  className={`${styles.serverNode} ${isActive ? styles.activeServer : ""}`}
                  transform={`translate(730 ${SERVER_Y[server.id] - 50})`}
                >
                  <rect width="170" height="100" rx="17" />
                  <circle cx="24" cy="24" r="7" />
                  <path d="M19 47h132M19 62h132" />
                  <text x="85" y="83" textAnchor="middle">{server.label.toUpperCase()}</text>
                </g>
              );
            })}

            <g
              className={`${styles.packet} ${phase === "response" ? styles.responsePacket : ""}`}
              style={{ transform: `translate(${token.x}px, ${token.y}px)` }}
              aria-hidden="true"
            >
              <rect x="-31" y="-16" width="62" height="32" rx="8" />
              <text textAnchor="middle" dominantBaseline="middle">{phase === "response" ? "RES" : "REQ"}</text>
            </g>
          </svg>
        </div>

        <aside className={styles.serverPanel} aria-label="Server の現在状態">
          <div className={styles.pointerCard}>
            <span>NEXT POINTER</span>
            <strong>{activeServer.label}</strong>
            <small>順番 {state.targetIndex + 1} / 3</small>
          </div>
          <ol className={styles.serverList}>
            {state.servers.map((server, index) => {
              const isActive = server.id === activeServer.id;
              return (
                <li key={server.id} className={isActive ? styles.activeCard : undefined}>
                  <span className={styles.serverOrder}>{index + 1}</span>
                  <div><strong>{server.label}</strong><small>{server.load}</small></div>
                  <output aria-label={`${server.label} の処理済み件数`}>{server.handled} handled</output>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <footer className={styles.legend}>
        <span><i className={styles.solidLine} /> Request direction</span>
        <span><i className={styles.dashedLine} /> Response direction</span>
        <span><i className={styles.activeMark}>→</i> Current route</span>
        <p>表示値と所要時間は UI 表現用の合成データです。実環境には接続していません。</p>
      </footer>
    </section>
  );
}

"use client";

import { useEffect, useReducer } from "react";
import {
  chooseHealthyServer,
  getScore,
  initialLoadBalancerState,
  loadBalancerReducer,
  REQUEST_GOAL,
  SERVER_IDS,
  type RequestToken,
  type ServerId,
} from "@/lib/scenarios/traffic-routing/round-robin-load-balancing/load-balancer-scenario";
import styles from "./load-balancer-demo.module.css";

const SERVER_COORDINATES: Record<ServerId, { x: number; y: number }> = {
  "server-a": { x: 730, y: 92 },
  "server-b": { x: 730, y: 225 },
  "server-c": { x: 730, y: 358 },
};

const SERVER_LABELS: Record<ServerId, string> = {
  "server-a": "Server A",
  "server-b": "Server B",
  "server-c": "Server C",
};

function requestPosition(request: RequestToken) {
  const loadBalancer = { x: 420, y: 225 };
  const server = SERVER_COORDINATES[request.target];
  const ratio = Math.min(1, request.progress);
  return {
    x: loadBalancer.x + (server.x - loadBalancer.x) * ratio,
    y: loadBalancer.y + (server.y - loadBalancer.y) * ratio,
  };
}

export function LoadBalancerDemo() {
  const [state, dispatch] = useReducer(loadBalancerReducer, initialLoadBalancerState);
  const expectedServer = chooseHealthyServer(state);
  const score = getScore(state);
  const remaining = REQUEST_GOAL - state.correctDecisions;
  const isFinished = state.outcome !== "playing";

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 650);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  return (
    <section className={styles.game} aria-labelledby="game-title">
      <header className={styles.gameHeader}>
        <div>
          <p className={styles.eyebrow}>TRAFFIC &amp; ROUTING · MINI GAME 01</p>
          <h2 id="game-title">ラウンドロビン・ディーラー</h2>
          <p className={styles.lead}>あなたは Load Balancer 係。到着順に Request を次の Healthy な Server へ配り、公平な循環を守ってください。</p>
        </div>
        <div className={styles.modePicker} aria-label="ゲームモード">
          <button type="button" aria-pressed={state.mode === "guided"} onClick={() => dispatch({ type: "select-mode", mode: "guided" })}>
            <strong>Guided</strong><span>次の配送先を表示</span>
          </button>
          <button type="button" aria-pressed={state.mode === "challenge"} onClick={() => dispatch({ type: "select-mode", mode: "challenge" })}>
            <strong>Challenge</strong><span>3 指標で採点</span>
          </button>
        </div>
      </header>

      <div className={styles.rules} aria-label="ゲームルール">
        <article><span>ROLE</span><strong>Load Balancer 係</strong></article>
        <article><span>GOAL</span><strong>{REQUEST_GOAL} 件を公平に処理</strong></article>
        <article><span>WIN</span><strong>順番と Healthy を守る</strong></article>
        <article><span>LOSE</span><strong>Down 配送 / 順番飛ばし</strong></article>
      </div>

      <div className={styles.hud}>
        <div><span>PROGRESS</span><strong>{state.correctDecisions} / {REQUEST_GOAL}</strong><small>残り {remaining} 件</small></div>
        <div><span>INBOX</span><strong>{state.pendingRequests}</strong><small>未配送 Request</small></div>
        <div><span>ACCURACY</span><strong>{score.accuracy}</strong><small>/ 100</small></div>
        <div><span>FAIRNESS</span><strong>{score.fairness}</strong><small>/ 100</small></div>
        <div><span>AVAILABILITY</span><strong>{score.availability}</strong><small>/ 100</small></div>
      </div>

      <div className={`${styles.feedback} ${styles[state.feedback.tone]}`} role="status" aria-live="polite">
        <span aria-hidden="true">{state.feedback.tone === "danger" ? "!" : state.feedback.tone === "success" ? "✓" : "i"}</span>
        <div><strong>{state.feedback.title}</strong><p>{state.feedback.detail}</p></div>
      </div>

      <div className={styles.playfield}>
        <div className={styles.canvasWrap}>
          <svg className={styles.canvas} viewBox="0 0 830 450" role="img" aria-labelledby="canvas-title canvas-desc">
            <title id="canvas-title">Request Queue、Load Balancer、3 台の Server の配送状況</title>
            <desc id="canvas-desc">未配送数は {state.pendingRequests} 件。Server A は {state.servers["server-a"]}、Server B は {state.servers["server-b"]}、Server C は {state.servers["server-c"]} です。</desc>
            <defs>
              <marker id="dealer-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
              <pattern id="dealer-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" /></pattern>
            </defs>
            <g className={styles.connections}>
              <path className={styles.queueLine} d="M172 225 H350" />
              {SERVER_IDS.map((serverId) => {
                const point = SERVER_COORDINATES[serverId];
                return <path key={serverId} className={state.servers[serverId] === "down" ? styles.excludedLine : undefined} d={`M490 225 L${point.x - 68} ${point.y}`} />;
              })}
            </g>
            <g className={styles.queueNode} transform="translate(42 174)">
              <rect width="130" height="102" rx="18" />
              <text x="65" y="32" textAnchor="middle" className={styles.nodeMicro}>REQUEST QUEUE</text>
              <text x="65" y="68" textAnchor="middle" className={styles.queueCount}>{state.pendingRequests}</text>
              <text x="65" y="88" textAnchor="middle">WAITING</text>
            </g>
            <g className={styles.balancerNode} transform="translate(350 165)">
              <rect width="140" height="120" rx="22" />
              <text x="70" y="43" textAnchor="middle" className={styles.balanceSymbol}>⇄</text>
              <text x="70" y="72" textAnchor="middle">Load Balancer</text>
              <text x="70" y="96" textAnchor="middle" className={styles.nodeMicro}>ROUND ROBIN</text>
            </g>
            {SERVER_IDS.map((serverId) => {
              const point = SERVER_COORDINATES[serverId];
              const down = state.servers[serverId] === "down";
              return (
                <g key={serverId} className={`${styles.serverNode} ${down ? styles.downNode : ""}`} transform={`translate(${point.x - 68} ${point.y - 43})`}>
                  <rect width="136" height="86" rx="16" />
                  {down && <rect className={styles.downPattern} width="136" height="86" rx="16" />}
                  <path className={styles.statusShape} d={down ? "M14 13 l10 10 m0-10 l-10 10" : "M14 18 l4 4 8-10"} />
                  <text x="68" y="38" textAnchor="middle">{SERVER_LABELS[serverId]}</text>
                  <text x="68" y="61" textAnchor="middle" className={styles.nodeMicro}>{down ? "DOWN · EXCLUDED" : `HEALTHY · ${state.deliveredByServer[serverId]} DEALT`}</text>
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

        <aside className={styles.dealerPanel} aria-labelledby="decision-title">
          <p className={styles.eyebrow}>YOUR DECISION</p>
          <h3 id="decision-title">次の配送先を選ぶ</h3>
          {state.mode === "guided" ? (
            <p className={styles.guide}>ガイド: 次は <strong>{expectedServer ? SERVER_LABELS[expectedServer] : "復旧した Server"}</strong>。Down を飛ばし、最後の配送先の次から続けます。</p>
          ) : (
            <p className={styles.guide}>Challenge: 状態と各配送数を見て、次の Healthy な宛先を判断してください。</p>
          )}
          <div className={styles.dealButtons}>
            {SERVER_IDS.map((serverId, index) => {
              const down = state.servers[serverId] === "down";
              return (
                <button key={serverId} type="button" onClick={() => dispatch({ type: "deal", serverId })} disabled={state.playback !== "running" || state.pendingRequests === 0 || isFinished}>
                  <span>{index + 1}</span><strong>{SERVER_LABELS[serverId]}</strong><small>{down ? "DOWN" : `HEALTHY · 配送 ${state.deliveredByServer[serverId]}`}</small>
                </button>
              );
            })}
          </div>
          <p className={styles.keyboardHint}>Tab で移動、Enter / Space で配送できます。</p>
        </aside>
      </div>

      <div className={styles.controlDeck}>
        <div className={styles.transport} aria-label="ゲーム進行">
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || isFinished}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset / Retry</button>
        </div>
        <label><span>Traffic <output>{state.traffic} req / wave</output></span><input aria-label="1回に到着するトラフィック量" type="range" min="1" max="5" step="1" value={state.traffic} onChange={(event) => dispatch({ type: "set-traffic", traffic: Number(event.target.value) })} /></label>
        <label><span>Animation <output>{state.speed.toFixed(1)}×</output></span><input aria-label="アニメーション速度" type="range" min="0.5" max="2" step="0.5" value={state.speed} onChange={(event) => dispatch({ type: "set-speed", speed: Number(event.target.value) })} /></label>
      </div>

      <div className={styles.failureDeck}>
        <div><p className={styles.eyebrow}>FAILURE INJECTION</p><strong>障害を注入して、除外と復帰を試す</strong></div>
        <div>
          {SERVER_IDS.map((serverId) => {
            const down = state.servers[serverId] === "down";
            return <button key={serverId} type="button" aria-pressed={down} onClick={() => dispatch({ type: down ? "recover" : "fail", serverId })}>{down ? "+ 復旧" : "× 停止"} {SERVER_LABELS[serverId]}</button>;
          })}
        </div>
      </div>

      {isFinished && (
        <section className={`${styles.result} ${state.outcome === "won" ? styles.resultWin : styles.resultLose}`} aria-labelledby="result-title">
          <div><p className={styles.eyebrow}>ROUND RESULT</p><h3 id="result-title">{state.outcome === "won" ? "CLEAR — 公平な配送を完了" : "ROUND FAILED — 原因を確認"}</h3><p>{state.feedback.detail}</p></div>
          <dl aria-label="Challenge 採点">
            <div><dt>正確性</dt><dd>{score.accuracy}</dd></div>
            <div><dt>公平性</dt><dd>{score.fairness}</dd></div>
            <div><dt>可用性</dt><dd>{score.availability}</dd></div>
            <div><dt>総合</dt><dd>{score.total}</dd></div>
          </dl>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>同じ初期状態で再挑戦</button>
        </section>
      )}

      <footer className={styles.learningFooter}>
        <p><strong>判断の原則:</strong> Round Robin は配送ポインターを順に進め、Down を候補から除外します。復旧後は循環へ戻すことで、Healthy な宛先間の公平性と可用性を両立します。</p>
        <p>固定の合成データだけを使う説明用ゲームです。実環境へ接続・操作せず、表示値は性能や可用性を保証しません。</p>
      </footer>
    </section>
  );
}

"use client";

import { useEffect, useReducer } from "react";
import {
  gatewayScenarioReducer,
  getScenarioExplanation,
  initialGatewayScenarioState,
  ROUTE_LABELS,
  type CommunicationDirection,
  type GatewayId,
} from "@/lib/scenarios/network-connectivity/internet-gateway-and-nat-gateway/internet-gateway-and-nat-gateway-scenario";
import styles from "./internet-gateway-and-nat-gateway-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const phaseLabels = {
  idle: "READY",
  running: "IN TRANSIT",
  paused: "PAUSED",
  blocked: "BLOCKED",
  completed: "COMPLETED",
} as const;

const nodeKinds: Record<string, string> = {
  Internet: "PUBLIC NETWORK",
  "Internet Gateway": "NETWORK EDGE",
  "Public Resource": "PUBLIC ZONE",
  "Private Resource": "PRIVATE ZONE",
  "NAT Gateway": "EGRESS ONLY",
};

export function InternetGatewayAndNatGatewayDemo() {
  const [state, dispatch] = useReducer(gatewayScenarioReducer, initialGatewayScenarioState, (initial) => gatewayScenarioReducer(initial, { type: "start" }));

  useEffect(() => {
    if (state.phase !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 850);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  function gatewayEnabled(gateway: GatewayId) {
    return gateway === "internetGateway" ? state.internetGatewayEnabled : state.natGatewayEnabled;
  }

  function setGateway(gateway: GatewayId) {
    dispatch({ type: "set-gateway", gateway, enabled: !gatewayEnabled(gateway) });
  }

  useTemplateLoop(state.phase === "completed" || state.phase === "blocked", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="gateway-demo-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 02 · SYNTHETIC DATA</p>
          <h2 id="gateway-demo-title">外部接続経路を比較する</h2>
          <p className={styles.description}>Ingress と Egress で通過する Gateway がどう変わるかを、通信の到達点と停止理由から確認します。</p>
        </div>
        <div className={`${styles.phase} ${styles[state.phase]}`} aria-live="polite">
          <span>CURRENT STATE</span>
          <strong>{phaseLabels[state.phase]}</strong>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.directionControl}>
          <span>COMMUNICATION DIRECTION</span>
          <div role="group" aria-label="通信方向">
            {(["ingress", "egress"] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                aria-pressed={state.direction === direction}
                onClick={() => dispatch({ type: "set-direction", direction })}
              >
                {direction === "ingress" ? "↓ Ingress" : "↑ Egress"}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.network} aria-label="Gateway 通信経路">
          <Route direction="ingress" selected={state.direction} step={state.step} />
          <div className={styles.boundary}>
            <span>NO DIRECT INGRESS</span>
            <p>Internet から Private Resource への直接経路はありません</p>
          </div>
          <Route direction="egress" selected={state.direction} step={state.step} />
        </div>

        <div className={`${styles.explanation} ${styles[state.phase]}`} role="status" aria-live="polite">
          <span aria-hidden="true">{state.phase === "blocked" ? "!" : "i"}</span>
          <div><strong>{phaseLabels[state.phase]}</strong><p>{getScenarioExplanation(state)}</p></div>
        </div>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.phase === "running" || state.phase === "completed"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.phase !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <div className={styles.gatewayControls}>
          <GatewayToggle id="internetGateway" label="Internet Gateway" enabled={state.internetGatewayEnabled} onToggle={setGateway} />
          <GatewayToggle id="natGateway" label="NAT Gateway" enabled={state.natGatewayEnabled} onToggle={setGateway} />
        </div>
      </div>

      <aside className={styles.learningNote}>
        <strong>WHY NETWORK &amp; CONNECTIVITY?</strong>
        <p>このテンプレートの判断対象は、外部通信がどのネットワーク境界と接続経路を通るかです。計算資源の性能やセキュリティルールではなく、到達性を学ぶため主カテゴリを Network &amp; Connectivity としています。</p>
      </aside>
    </section>
  );
}

function Route({ direction, selected, step }: { direction: CommunicationDirection; selected: CommunicationDirection; step: number }) {
  const active = direction === selected;
  return (
    <div className={`${styles.route} ${active ? styles.selectedRoute : ""}`} aria-label={`${direction} route`}>
      <div className={styles.routeLabel}><strong>{direction.toUpperCase()}</strong><span>{direction === "ingress" ? "外部から受信" : "外部へ送信"}</span></div>
      <div className={styles.routeNodes}>
        {ROUTE_LABELS[direction].map((label, index) => (
          <div className={styles.routeSegment} key={label}>
            {index > 0 && <div className={`${styles.arrow} ${active && index <= step ? styles.reached : ""}`}><span>{direction === "ingress" ? "IN" : "OUT"}</span>→</div>}
            <div className={`${styles.node} ${active && index <= step ? styles.reachedNode : ""}`}>
              <span className={styles.nodeShape} aria-hidden="true">{label.includes("Gateway") ? "◇" : label === "Internet" ? "◎" : "▣"}</span>
              <strong>{label}</strong><small>{nodeKinds[label]}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GatewayToggle({ id, label, enabled, onToggle }: { id: GatewayId; label: string; enabled: boolean; onToggle: (id: GatewayId) => void }) {
  return (
    <button type="button" className={styles.gatewayToggle} aria-pressed={enabled} onClick={() => onToggle(id)}>
      <span className={styles.switchTrack} aria-hidden="true"><span /></span>
      <span><strong>{label}</strong><small>{enabled ? "ENABLED · 通過可能" : "DISABLED · 通過不可"}</small></span>
    </button>
  );
}

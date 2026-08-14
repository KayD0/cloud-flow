"use client";

import { useEffect, useReducer } from "react";
import { ENDPOINTS, initialVpnScenarioState, vpnScenarioReducer, type EndpointId, type Packet } from "@/lib/scenarios/network-connectivity/site-to-site-vpn-connectivity/site-to-site-vpn-connectivity-scenario";
import styles from "./site-to-site-vpn-connectivity-demo.module.css";

const endpointIds = Object.keys(ENDPOINTS) as EndpointId[];
const tunnelLabels = { disconnected: "DISCONNECTED", connecting: "CONNECTING", connected: "CONNECTED", disconnecting: "DISCONNECTING" } as const;

function packetPosition(packet: Packet) {
  const progress = packet.direction === "outbound" ? packet.progress : 1 - packet.progress;
  return { x: 170 + progress * 560, y: 235 };
}

export function SiteToSiteVpnConnectivityDemo() {
  const [state, dispatch] = useReducer(vpnScenarioReducer, initialVpnScenarioState, (initial) => vpnScenarioReducer(initial, { type: "start" }));
  useEffect(() => {
    if (state.playback !== "running" && state.tunnel !== "connecting" && state.tunnel !== "disconnecting") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 700);
    return () => window.clearInterval(timer);
  }, [state.playback, state.tunnel]);

  const tunnelActive = state.tunnel === "connected";
  return <section className={styles.demo} aria-labelledby="vpn-demo-title">
    <div className={styles.header}>
      <div><p className={styles.eyebrow}>INTERACTIVE SCENARIO 02</p><h2 id="vpn-demo-title">Site-to-Site VPN Connectivity</h2><p>On-premises Network と Cloud Network の境界を、2つの Gateway と合成 VPN Tunnel がどのようにつなぐかを追跡します。</p></div>
      <div className={`${styles.status} ${styles[state.tunnel]}`} aria-live="polite"><span>TUNNEL STATUS</span><strong>{tunnelLabels[state.tunnel]}</strong></div>
    </div>

    <div className={styles.canvasWrap}>
      <svg className={styles.canvas} viewBox="0 0 900 470" role="img" aria-labelledby="vpn-canvas-title vpn-canvas-desc">
        <title id="vpn-canvas-title">On-premises Network と Cloud Network 間の VPN 接続</title>
        <desc id="vpn-canvas-desc">送信元から On-premises VPN Gateway、合成 VPN Tunnel、Cloud VPN Gateway を通り宛先へ至る双方向経路</desc>
        <defs><marker id="vpn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" /></marker></defs>
        <rect className={styles.boundary} x="20" y="55" width="280" height="350" rx="22" /><rect className={styles.boundary} x="600" y="55" width="280" height="350" rx="22" />
        <text className={styles.boundaryLabel} x="45" y="88">ON-PREMISES NETWORK</text><text className={styles.boundaryLabel} x="625" y="88">CLOUD NETWORK</text>
        <path className={`${styles.tunnel} ${tunnelActive ? styles.activeTunnel : ""}`} d="M300 235 H600" />
        <text className={styles.tunnelLabel} x="450" y="206" textAnchor="middle">ENCRYPTED VPN TUNNEL (SYNTHETIC)</text>
        <g className={styles.endpoint} transform="translate(55 190)"><rect width="115" height="90" rx="16"/><text x="57" y="39" textAnchor="middle">▣</text><text x="57" y="65" textAnchor="middle">Endpoint</text></g>
        <g className={styles.gateway} transform="translate(205 180)"><path d="M0 18 48 0 96 18v74L48 110 0 92z"/><text x="48" y="48" textAnchor="middle">⇄</text><text x="48" y="72" textAnchor="middle">VPN</text><text x="48" y="88" textAnchor="middle">Gateway</text></g>
        <g className={styles.gateway} transform="translate(599 180)"><path d="M0 18 48 0 96 18v74L48 110 0 92z"/><text x="48" y="48" textAnchor="middle">⇄</text><text x="48" y="72" textAnchor="middle">VPN</text><text x="48" y="88" textAnchor="middle">Gateway</text></g>
        <g className={styles.endpoint} transform="translate(730 190)"><rect width="115" height="90" rx="16"/><text x="57" y="39" textAnchor="middle">▤</text><text x="57" y="65" textAnchor="middle">Endpoint</text></g>
        <path className={styles.route} d="M170 235 H205 M695 235 H730" />
        <g className={styles.packets} aria-hidden="true">{state.packets.map((packet) => { const position = packetPosition(packet); return <g key={packet.id} transform={`translate(${position.x} ${position.y})`}><circle r="8"/><path d={packet.direction === "outbound" ? "M-3-3 3 0-3 3" : "M3-3-3 0 3 3"}/></g>; })}</g>
        <text className={styles.endpointName} x="112" y="315" textAnchor="middle">{ENDPOINTS[state.source].side === "on-premises" ? ENDPOINTS[state.source].label : ENDPOINTS[state.destination].label}</text>
        <text className={styles.endpointName} x="788" y="315" textAnchor="middle">{ENDPOINTS[state.source].side === "cloud" ? ENDPOINTS[state.source].label : ENDPOINTS[state.destination].label}</text>
      </svg>
    </div>

    <div className={styles.controls} aria-label="シナリオ操作">
      <div className={styles.transport}><button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running"}>▶ Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button></div>
      <button className={styles.connect} type="button" onClick={() => dispatch({ type: tunnelActive ? "disconnect" : "connect" })} disabled={state.tunnel === "connecting" || state.tunnel === "disconnecting"}>{tunnelActive ? "Disconnect Tunnel" : "Connect Tunnel"}</button>
      <label><span>送信元</span><select value={state.source} onChange={(event) => dispatch({ type: "set-source", endpoint: event.target.value as EndpointId })}>{endpointIds.map((id) => <option key={id} value={id}>{ENDPOINTS[id].label}</option>)}</select></label>
      <label><span>宛先</span><select value={state.destination} onChange={(event) => dispatch({ type: "set-destination", endpoint: event.target.value as EndpointId })}>{endpointIds.map((id) => <option key={id} value={id}>{ENDPOINTS[id].label}</option>)}</select></label>
    </div>
    <div className={styles.explanation} aria-live="polite"><div><span>CURRENT STATE</span><strong>{state.explanation}</strong></div><dl><div><dt>DELIVERED</dt><dd>{state.deliveredPackets}</dd></div><div><dt>BLOCKED</dt><dd>{state.blockedPackets}</dd></div></dl></div>
    <aside className={styles.learning}><strong>Why Network &amp; Connectivity?</strong><p>学習の中心が計算処理や特定 Provider ではなく、異なるネットワーク境界を Gateway と Tunnel で接続し、経路の成立条件を判断することにあるためです。表示はすべて説明用の合成データで、実環境には作用しません。</p></aside>
  </section>;
}

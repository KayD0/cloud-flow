"use client";

import { useEffect, useReducer } from "react";
import {
  egressProgress,
  gatewaySceneReducer,
  ingressProgress,
  initialGatewaySceneState,
} from "@/lib/scenarios/network-connectivity/internet-gateway-and-nat-gateway/internet-gateway-and-nat-gateway-scenario";
import styles from "./internet-gateway-and-nat-gateway-demo.module.css";

const phaseLabels = {
  "public-ingress": ["INGRESS ACTIVE", "External request → Public Resource"],
  "route-handoff": ["ROUTE HANDOFF", "Ingress complete / Egress preparing"],
  "private-egress": ["EGRESS ACTIVE", "Private Resource → NAT → Internet"],
  "cycle-reset": ["CYCLE COMPLETE", "Traffic lanes returning to standby"],
} as const;

function packetPosition(progress: number, points: readonly { x: number; y: number }[]) {
  const scaled = progress * (points.length - 1);
  const index = Math.min(Math.floor(scaled), points.length - 2);
  const ratio = scaled - index;
  return {
    x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
    y: points[index].y + (points[index + 1].y - points[index].y) * ratio,
  };
}

export function InternetGatewayAndNatGatewayDemo() {
  const [scene, dispatch] = useReducer(gatewaySceneReducer, initialGatewaySceneState);

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 700);
    return () => window.clearInterval(timer);
  }, []);

  const ingress = packetPosition(ingressProgress(scene.tick), [
    { x: 82, y: 178 }, { x: 250, y: 178 }, { x: 410, y: 115 }, { x: 590, y: 115 },
  ]);
  const egress = packetPosition(egressProgress(scene.tick), [
    { x: 590, y: 325 }, { x: 410, y: 325 }, { x: 250, y: 245 }, { x: 82, y: 245 },
  ]);
  const [status, detail] = phaseLabels[scene.phase];

  return (
    <section className={`${styles.scene} overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl`} aria-labelledby="gateway-scene-title">
      <header className="flex flex-col gap-5 border-b border-slate-800 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-cyan-300">NETWORK CONNECTIVITY · AUTO SCENE 02</p>
          <h2 id="gateway-scene-title" className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">イングレス・エグレス管制</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">公開入口とプライベート出口を、方向の異なる二本の通信レーンで自動再生します。</p>
        </div>
        <div className="min-w-64 rounded-xl border border-cyan-800 bg-cyan-950/40 px-4 py-3" aria-live="polite">
          <p className="font-mono text-xs font-bold tracking-widest text-cyan-300">{status}</p>
          <p className="mt-1 text-sm text-slate-300">{detail}</p>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className={styles.board}>
          <svg viewBox="0 0 680 440" role="img" aria-labelledby="network-title network-desc">
            <title id="network-title">Internet Gateway and NAT Gateway communication map</title>
            <desc id="network-desc">External Network から Internet Gateway を通って Public Resource に入る通信と、Private Resource から NAT Gateway と Internet Gateway を通って外へ出る通信。</desc>
            <defs>
              <marker id="ingress-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker>
              <marker id="egress-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" /></pattern>
            </defs>
            <rect className={styles.grid} width="680" height="440" rx="18" />
            <rect className={styles.zone} x="330" y="42" width="300" height="356" rx="24" />
            <text className={styles.zoneLabel} x="352" y="69">PRIVATE NETWORK BOUNDARY</text>

            <g className={styles.node} transform="translate(32 164)"><path d="M10 30Q22 6 45 22Q64 3 82 26Q102 27 102 48Q102 68 80 68H22Q2 68 2 49Q2 34 10 30Z" /><text x="52" y="91">External Network</text></g>
            <g className={`${styles.node} ${styles.gateway}`} transform="translate(202 151)"><path d="M0 18 48 0 96 18V82L48 100 0 82Z" /><text x="48" y="43">↔</text><text x="48" y="119">Internet Gateway</text><text className={styles.stateText} x="48" y="135">EDGE · ATTACHED</text></g>
            <g className={`${styles.node} ${styles.publicNode}`} transform="translate(520 78)"><rect width="122" height="76" rx="14" /><text x="61" y="34">▤</text><text x="61" y="57">Public Resource</text></g>
            <g className={`${styles.node} ${styles.nat}`} transform="translate(356 282)"><path d="M48 0 96 24V76L48 100 0 76V24Z" /><text x="48" y="43">NAT</text><text className={styles.stateText} x="48" y="63">EGRESS ONLY</text><text x="48" y="119">NAT Gateway</text></g>
            <g className={`${styles.node} ${styles.privateNode}`} transform="translate(520 288)"><rect width="122" height="76" rx="14" /><text x="61" y="34">▣</text><text x="61" y="57">Private Resource</text></g>

            <path className={`${styles.route} ${styles.ingressRoute}`} d="M112 178H250L410 115H520" markerEnd="url(#ingress-arrow)" />
            <path className={`${styles.route} ${styles.egressRoute}`} d="M520 325H452M356 325H410L250 245H112" markerEnd="url(#egress-arrow)" />
            <text className={styles.ingressLabel} x="335" y="102">① INGRESS · PUBLIC ENTRY</text>
            <text className={styles.egressLabel} x="300" y="354">② EGRESS · NAT TRANSLATION</text>

            <g className={styles.ingressPacket} transform={`translate(${ingress.x} ${ingress.y})`} aria-hidden="true"><circle r="11" /><path d="M-4 0H4M1-3 4 0 1 3" /></g>
            <g className={styles.egressPacket} transform={`translate(${egress.x} ${egress.y})`} aria-hidden="true"><rect x="-10" y="-10" width="20" height="20" rx="4" /><path d="M4 0H-4M-1-3-4 0-1 3" /></g>
            <g className={styles.reducedPackets} aria-hidden="true"><circle cx="590" cy="115" r="11" /><rect x="72" y="235" width="20" height="20" rx="4" /></g>
          </svg>
        </div>

        <aside className="grid content-start gap-3" aria-label="Gateway states">
          <StateCard index="01" title="Internet Gateway" state="EDGE ATTACHED" note="Public ingress / outbound edge" active={scene.phase === "public-ingress"} />
          <StateCard index="02" title="NAT Gateway" state="EGRESS ONLY" note="No unsolicited inbound route" active={scene.phase === "private-egress"} />
          <div className="rounded-xl border border-dashed border-amber-700 bg-amber-950/20 p-4">
            <p className="font-mono text-[10px] font-bold tracking-widest text-amber-300">POLICY</p>
            <p className="mt-2 text-sm font-bold">Private inbound: BLOCKED</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">NAT は外部から始まる新規通信の入口にはなりません。</p>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800 px-5 py-4 font-mono text-[10px] tracking-wider text-slate-500 sm:px-8">
        <span>● CIRCLE = INGRESS PACKET</span><span>■ SQUARE = EGRESS PACKET</span><span>— SOLID = PUBLIC ROUTE</span><span>┄ DASHED = NAT ROUTE</span>
      </footer>
    </section>
  );
}

function StateCard({ index, title, state, note, active }: { index: string; title: string; state: string; note: string; active: boolean }) {
  return <div className={`rounded-xl border p-4 transition-colors ${active ? "border-cyan-500 bg-cyan-950/40" : "border-slate-700 bg-slate-900/70"}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-500">{index}</span><span className={`rounded-full border px-2 py-1 font-mono text-[9px] font-bold tracking-wider ${active ? "border-cyan-500 text-cyan-300" : "border-slate-600 text-slate-400"}`}>{active ? "ACTIVE" : "STANDBY"}</span></div><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 font-mono text-[10px] font-bold text-emerald-300">{state}</p><p className="mt-2 text-xs leading-5 text-slate-400">{note}</p></div>;
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DNS_PHASES, DNS_SCENE_DURATION_MS, getDnsSceneState, reducedMotionDnsSceneState, type DnsPhase } from "@/lib/scenarios/traffic-routing/dns-resolution-and-failover/dns-resolution-and-failover-scenario";
import styles from "./dns-resolution-and-failover-demo.module.css";

const phaseLabels: Record<DnsPhase, { label: string; detail: string }> = {
  resolving: { label: "01 名前解決", detail: "Client の問い合わせを Resolver が権威 DNS へ転送" },
  "primary-connected": { label: "02 Primary 接続", detail: "返された宛先へリクエストを配送" },
  "failure-detected": { label: "03 障害検知", detail: "Health Check が応答停止を検知" },
  "failing-over": { label: "04 DNS 切替", detail: "Resolver の応答を Secondary へ更新" },
  "secondary-connected": { label: "05 通信復旧", detail: "代替 Endpoint への経路で通信を継続" },
};

function NodeIcon({ children }: { children: ReactNode }) {
  return <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-current font-mono text-xs font-black">{children}</span>;
}

export function DnsResolutionAndFailoverDemo() {
  const [scene, setScene] = useState(() => getDnsSceneState(0));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setScene(getDnsSceneState(performance.now() - startedAt)), 120);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const displayedScene = reducedMotion ? reducedMotionDnsSceneState : scene;
  const current = phaseLabels[displayedScene.phase];
  const progress = (displayedScene.elapsedMs / DNS_SCENE_DURATION_MS) * 100;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-700 bg-[#07111f] text-slate-100 shadow-2xl" aria-labelledby="dns-rescue-title">
      <header className="flex flex-col gap-5 border-b border-slate-700 px-5 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] font-bold tracking-[0.2em] text-cyan-300">TRAFFIC &amp; ROUTING / AUTO SCENE</p>
          <h2 id="dns-rescue-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">DNSレスキュー</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">名前解決、Endpoint 障害の検知、代替経路への切替を俯瞰する自動再生フィールド</p>
        </div>
        <div className="min-w-60 rounded-2xl border border-cyan-400/40 bg-cyan-950/30 px-4 py-3" aria-live="polite">
          <span className="font-mono text-[0.62rem] font-bold tracking-widest text-cyan-300">CURRENT EVENT</span>
          <strong className="mt-1 block text-base">{reducedMotion ? "静的サマリー" : current.label}</strong>
          <p className="mt-1 text-xs text-slate-400">{reducedMotion ? "正常経路 → 障害 → 代替経路" : current.detail}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 border-b border-slate-700 bg-slate-950/40 md:grid-cols-5" aria-label="シーン進行">
        {DNS_PHASES.map((phase, index) => <div key={phase} className={`border-slate-800 px-3 py-3 text-xs md:border-r ${index <= displayedScene.phaseIndex ? "text-cyan-200" : "text-slate-600"}`} aria-current={phase === displayedScene.phase ? "step" : undefined}><span className="font-mono font-bold">{phaseLabels[phase].label}</span></div>)}
      </div>
      <div className="h-1 bg-slate-800" aria-hidden="true"><div className="h-full bg-cyan-400 transition-[width] duration-150" style={{ width: reducedMotion ? "100%" : `${progress}%` }} /></div>

      <div className={`relative min-h-[570px] overflow-hidden bg-[linear-gradient(rgba(51,65,85,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,.2)_1px,transparent_1px)] bg-[size:32px_32px] p-4 sm:p-7 ${styles.field}`} data-phase={displayedScene.phase}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 570" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="dns-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" /></marker></defs>
          <g className={styles.routes}>
            <path className={styles.resolverRoute} d="M180 285 H350" /><path className={styles.authorityRoute} d="M420 235 V145 H570" />
            <path className={styles.primaryRoute} d="M470 285 H735 V205 H810" /><path className={styles.secondaryRoute} d="M470 285 H735 V405 H810" />
            <path className={styles.healthRoute} d="M655 205 H735" strokeDasharray="9 9" />
          </g>
          {!reducedMotion && <circle r="8" className={styles.packet}><animateMotion dur="1.35s" repeatCount="indefinite" path={displayedScene.route === "resolver" ? "M180 285 H350 V145 H570" : displayedScene.route === "primary" ? "M180 285 H810 V205" : displayedScene.route === "health-check" ? "M655 205 H810" : "M180 285 H735 V405 H810"} /></circle>}
        </svg>

        <div className="relative z-10 grid min-h-[510px] grid-cols-2 grid-rows-[1fr_auto_1fr] gap-4 lg:grid-cols-[1fr_1.1fr_1fr] lg:grid-rows-2">
          <article className="col-span-2 self-center rounded-2xl border-2 border-sky-400 bg-slate-900/95 p-4 lg:col-span-1 lg:row-span-2" aria-label="Client Requester">
            <div className="flex items-center gap-3 text-sky-300"><NodeIcon>REQ</NodeIcon><div><small className="font-mono text-[0.6rem] tracking-widest">REQUESTER</small><h3 className="font-bold text-white">Client</h3></div></div><p className="mt-3 text-xs text-slate-400">query: app.example.test</p>
          </article>
          <article className="col-span-2 place-self-center rounded-2xl border-2 border-violet-400 bg-slate-900/95 p-4 lg:col-span-1 lg:row-span-2" aria-label="DNS Resolver">
            <div className="flex items-center gap-3 text-violet-300"><NodeIcon>DNS</NodeIcon><div><small className="font-mono text-[0.6rem] tracking-widest">RESOLVER</small><h3 className="font-bold text-white">DNS Resolver</h3></div></div>
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"><span className="text-slate-500">ANSWER </span><strong className={displayedScene.resolverAnswer === "secondary" ? "text-amber-300" : "text-emerald-300"}>{displayedScene.resolverAnswer === "primary" ? "192.0.2.10" : "192.0.2.20"}</strong></div>
          </article>
          <article className="rounded-2xl border border-dashed border-violet-400 bg-violet-950/50 p-3 lg:col-start-2 lg:row-start-1 lg:ml-auto lg:self-start" aria-label="Authoritative DNS"><small className="font-mono text-[0.58rem] tracking-widest text-violet-300">AUTHORITATIVE DNS</small><strong className="mt-1 block text-sm">Route record</strong></article>
          <Endpoint kind="primary" status={displayedScene.primaryStatus === "down" ? "× DOWN / TIMEOUT" : "● HEALTHY / ACTIVE"} active={displayedScene.primaryStatus !== "down"} />
          <Endpoint kind="secondary" status={displayedScene.secondaryStatus === "active" ? "▶ ACTIVE / ROUTED" : "◇ HEALTHY / STANDBY"} active={displayedScene.secondaryStatus === "active"} />
        </div>
      </div>
      <footer className="flex flex-col gap-3 border-t border-slate-700 bg-slate-950/50 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p><strong className="mr-2 font-mono text-cyan-300">SYNTHETIC SCENE</strong>ベンダーニュートラルな架空アドレスと状態を使用</p><p className="font-mono">AUTO LOOP · 12 SEC · NO USER ACTION</p></footer>
    </section>
  );
}

function Endpoint({ kind, status, active }: { kind: "primary" | "secondary"; status: string; active: boolean }) {
  const down = status.includes("DOWN");
  const color = down ? "border-rose-400 text-rose-300 border-dashed" : active ? (kind === "primary" ? "border-emerald-400 text-emerald-300" : "border-amber-300 text-amber-300") : "border-slate-500 text-slate-400";
  return <article className={`rounded-2xl border-2 bg-slate-900/95 p-4 ${color}`} aria-label={`${kind === "primary" ? "Primary" : "Secondary"} Endpoint: ${status}`}><div className="flex items-center gap-3"><NodeIcon>{kind === "primary" ? "P1" : "S2"}</NodeIcon><div><small className="font-mono text-[0.6rem] tracking-widest">{kind.toUpperCase()} ENDPOINT</small><h3 className="font-bold text-white">Zone {kind === "primary" ? "North" : "South"}</h3></div></div><span className="mt-3 inline-flex rounded-full border border-current px-2 py-1 font-mono text-[0.62rem] font-black">{status}</span></article>;
}

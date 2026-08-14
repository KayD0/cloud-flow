"use client";

import { useEffect, useReducer } from "react";
import {
  hasReachedPhase,
  initialPrivatePathState,
  privatePathReducer,
  type PrivatePathPhase,
} from "@/lib/scenarios/network-connectivity/private-link-private-endpoint/private-link-private-endpoint-scenario";
import styles from "./private-link-private-endpoint-demo.module.css";

const phaseCopy: Record<PrivatePathPhase, { label: string; detail: string }> = {
  ready: { label: "READY", detail: "Client がリクエストを準備" },
  resolving: { label: "PRIVATE DNS", detail: "名前をプライベート IP に解決" },
  connecting: { label: "ENDPOINT", detail: "Private Endpoint に接続" },
  transferring: { label: "PRIVATE LINK", detail: "隔離された経路で転送" },
  delivered: { label: "DELIVERED", detail: "Service が受信" },
};

const nodeBase = "relative z-10 flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 bg-slate-950/90 px-4 py-5 text-center shadow-2xl";

export function PrivateLinkPrivateEndpointDemo() {
  const [state, dispatch] = useReducer(privatePathReducer, initialPrivatePathState);
  const endpointActive = hasReachedPhase(state.phase, "connecting");
  const serviceActive = state.phase === "delivered";

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: "advance" }), 1500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-700 bg-[#07101d] shadow-[0_28px_80px_rgba(0,0,0,.45)]" aria-labelledby="private-path-title">
      <header className="flex flex-col gap-5 border-b border-slate-700/80 px-5 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[.68rem] font-bold tracking-[.2em] text-emerald-300">NETWORK CONNECTIVITY · AUTO SCENE 19</p>
          <h2 id="private-path-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">プライベート・パス</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">Client の通信は Public Internet へ出ず、Private Endpoint と Private Link を通って Service に到達します。</p>
        </div>
        <div className="min-w-52 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3" aria-live="polite" aria-atomic="true">
          <span className="block font-mono text-[.62rem] tracking-widest text-emerald-300">CURRENT STATE · LOOP {state.cycle.toString().padStart(2, "0")}</span>
          <strong className="mt-1 block text-sm text-white">{phaseCopy[state.phase].label} — {phaseCopy[state.phase].detail}</strong>
        </div>
      </header>

      <div className="grid grid-cols-2 border-b border-slate-700/80 bg-slate-900/60 text-center sm:grid-cols-4">
        {["01 Resolve", "02 Connect", "03 Transfer", "04 Deliver"].map((step, index) => (
          <div key={step} className="border-slate-700 px-3 py-3 font-mono text-[.65rem] font-bold tracking-wider text-slate-400 odd:border-r sm:border-r sm:last:border-r-0">
            {step}<span className="ml-2 text-emerald-300" aria-hidden="true">{PRIVATE_STEP_DONE[state.phase][index] ? "◆" : "◇"}</span>
          </div>
        ))}
      </div>

      <div className={`relative min-h-[650px] overflow-hidden bg-[linear-gradient(rgba(51,65,85,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,.22)_1px,transparent_1px)] bg-[size:28px_28px] p-4 sm:min-h-[440px] sm:p-7 ${styles.board}`}>
        <div className="absolute inset-x-[7%] top-1/2 hidden h-px bg-emerald-300/30 sm:block" aria-hidden="true" />
        <div className={`absolute left-[16%] top-[calc(50%-5px)] hidden h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_#6ee7b7] sm:block ${styles.packet}`} aria-hidden="true" />

        <div className="relative grid h-full grid-cols-1 items-center gap-8 sm:min-h-[380px] sm:grid-cols-[1fr_.55fr_1.15fr_.55fr_1fr] sm:gap-3">
          <article className={`${nodeBase} border-cyan-400/60`}>
            <span className="text-3xl" aria-hidden="true">▣</span><span className="mt-2 font-mono text-[.58rem] tracking-widest text-cyan-300">PRIVATE NETWORK</span><strong className="mt-1">Client</strong><small className="mt-2 text-slate-400">10.24.1.8 · synthetic</small>
          </article>
          <div className="text-center font-mono text-[.6rem] font-bold tracking-wider text-emerald-300"><span className="block sm:hidden">↓</span><span>PRIVATE IP</span><span className="hidden sm:block">······▶</span></div>
          <article className={`${nodeBase} ${endpointActive ? "border-emerald-300 shadow-[0_0_28px_rgba(110,231,183,.22)]" : "border-dashed border-slate-500"}`}>
            <span className="text-3xl" aria-hidden="true">⬡</span><span className="mt-2 font-mono text-[.58rem] tracking-widest text-emerald-300">CONNECTION TARGET</span><strong className="mt-1">Private Endpoint</strong><small className="mt-2 text-slate-400">{endpointActive ? "CONNECTED · 10.24.2.4" : "STANDBY · private IP"}</small>
          </article>
          <div className="text-center font-mono text-[.6rem] font-bold tracking-wider text-emerald-300"><span className="block sm:hidden">↓</span><span>PRIVATE LINK</span><span className="hidden sm:block">══════▶</span></div>
          <article className={`${nodeBase} ${serviceActive ? "border-violet-300 shadow-[0_0_28px_rgba(196,181,253,.25)]" : "border-violet-400/50"}`}>
            <span className="text-3xl" aria-hidden="true">◆</span><span className="mt-2 font-mono text-[.58rem] tracking-widest text-violet-300">SERVICE NETWORK</span><strong className="mt-1">Service</strong><small className="mt-2 text-slate-400">private ingress · synthetic</small>
          </article>
        </div>

        <aside className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-xl border border-dashed border-rose-400/50 bg-rose-950/20 px-4 py-3 text-rose-200 sm:bottom-6 sm:left-[7%] sm:right-[7%]" aria-label="Public Internet is not used">
          <div><strong className="block font-mono text-xs tracking-widest">PUBLIC INTERNET</strong><span className="mt-1 block text-xs text-rose-200/70">経路対象外 · NO EGRESS</span></div>
          <span className="rounded-md border border-rose-300/60 px-3 py-1 font-mono text-xs font-bold">BLOCKED ×</span>
        </aside>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-700/80 bg-slate-900/60 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p><span className="mr-2 text-emerald-300">●</span>自動再生中 · 約 7.5 秒で初期状態へ戻ります</p>
        <p className="font-mono">VENDOR NEUTRAL · SYNTHETIC DATA</p>
      </footer>
    </section>
  );
}

const PRIVATE_STEP_DONE: Record<PrivatePathPhase, readonly boolean[]> = {
  ready: [false, false, false, false],
  resolving: [true, false, false, false],
  connecting: [true, true, false, false],
  transferring: [true, true, true, false],
  delivered: [true, true, true, true],
};

"use client";

import { useEffect, useReducer } from "react";
import {
  CACHE_PRESETS,
  cacheHitMissReducer,
  initialCacheHitMissState,
  type CachePhase,
  type CachePreset,
} from "@/lib/scenarios/data-storage/cache-hit-miss/cache-hit-miss-scenario";
import styles from "./cache-hit-miss-demo.module.css";
import { useTemplateLoop } from "@/components/templates/use-template-loop";

const STATE_LABELS = { idle: "READY", running: "RUNNING", paused: "PAUSED", completed: "COMPLETED" } as const;
const PRESET_LABELS: Record<CachePreset, string> = { cold: "Cold（値なし）", warm: "Warm（有効）", expired: "Expired（期限切れ）" };
const PHASE_LABELS: Record<CachePhase, string> = {
  idle: "初期状態", application: "Applicationから要求", "cache-check": "Cacheを確認", "hit-response": "HIT: Cacheから応答",
  miss: "MISS: 永続Storeへ", database: "Databaseから取得", "cache-update": "Cacheを更新", response: "Applicationへ応答", completed: "完了",
};

function explanation(state: typeof initialCacheHitMissState) {
  if (state.playback === "idle") return "Cache状態、TTL、Request回数を選び、Startで合成リクエストを送信します。";
  if (state.playback === "paused") return `${PHASE_LABELS[state.phase]}の直前で一時停止しています。`;
  if (state.playback === "completed") return `${state.requestCount}回の要求が完了しました。HIT ${state.hits}回、MISS ${state.misses}回です。`;
  if (state.phase === "cache-check") return state.cacheHasValue && state.cacheAge < state.ttl
    ? `保存値の経過 ${state.cacheAge}秒はTTL ${state.ttl}秒未満のため、HITと判断します。`
    : `値がないか、経過 ${state.cacheAge}秒がTTL ${state.ttl}秒以上のため、MISSと判断します。`;
  if (state.phase === "cache-update") return "Databaseで取得した合成値をCacheへ保存し、TTLの計時を0秒から始めます。";
  return `${PHASE_LABELS[state.phase]}を処理しています。`;
}

function isActive(phase: CachePhase, targets: CachePhase[]) {
  return targets.includes(phase);
}

export function CacheHitMissDemo() {
  const [state, dispatch] = useReducer(cacheHitMissReducer, initialCacheHitMissState, (initial) => cacheHitMissReducer(initial, { type: "start" }));
  const cacheStatus = !state.cacheHasValue ? "EMPTY" : state.cacheAge >= state.ttl ? "EXPIRED" : "FRESH";
  const settingsDisabled = state.playback !== "idle";

  useEffect(() => {
    if (state.playback !== "running") return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 650);
    return () => window.clearInterval(timer);
  }, [state.playback]);

  useTemplateLoop(state.playback === "completed", () => { dispatch({ type: "reset" }); dispatch({ type: "start" }); });

  return (
    <section className={styles.demo} aria-labelledby="cache-demo-title">
      <div className={styles.demoHeader}>
        <div>
          <p className={styles.eyebrow}>INTERACTIVE SCENARIO 01</p>
          <h2 id="cache-demo-title">Cache HIT / MISS</h2>
          <p className={styles.description}>Application → Cacheを起点に、HITの短い経路とMISS時のDatabase・Cache updateを比較します。</p>
        </div>
        <div className={styles.stateBadge} data-state={state.playback}><span>CURRENT STATE</span><strong>{STATE_LABELS[state.playback]}</strong></div>
      </div>

      <div className={styles.statusPanel} aria-live="polite">
        <strong>{PHASE_LABELS[state.phase]}</strong><span>{explanation(state)}</span>
      </div>

      <div className={styles.canvasWrap}>
        <svg className={styles.canvas} viewBox="0 0 920 500" role="img" aria-labelledby="cache-canvas-title cache-canvas-desc">
          <title id="cache-canvas-title">Cache HITとMISSのデータ取得経路</title>
          <desc id="cache-canvas-desc">ApplicationからCacheへ要求し、HITは上側の実線で応答、MISSは下側の破線でDatabaseへ進みCacheを更新して応答します。</desc>
          <defs>
            <marker id="cache-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" /></marker>
          </defs>
          <g className={styles.connections}>
            <path className={isActive(state.phase, ["application", "cache-check"]) ? styles.activePath : ""} d="M180 245H330" />
            <path className={`${styles.hitPath} ${isActive(state.phase, ["hit-response", "response"]) && state.currentOutcome === "hit" ? styles.activePath : ""}`} d="M470 220C580 100 690 105 770 190" />
            <path className={`${styles.missPath} ${isActive(state.phase, ["miss", "database"]) ? styles.activePath : ""}`} d="M470 275C550 360 605 380 660 380" />
            <path className={`${styles.updatePath} ${state.phase === "cache-update" ? styles.activePath : ""}`} d="M660 345C600 285 545 265 470 255" />
            <path className={`${styles.responsePath} ${state.phase === "response" && state.currentOutcome === "miss" ? styles.activePath : ""}`} d="M790 355C860 315 860 245 825 220" />
          </g>
          <g className={`${styles.node} ${isActive(state.phase, ["application", "response"]) ? styles.activeNode : ""}`} transform="translate(45 195)">
            <rect width="135" height="100" rx="18" /><text x="68" y="43" textAnchor="middle" className={styles.nodeIcon}>A</text><text x="68" y="70" textAnchor="middle">Application</text><text x="68" y="88" textAnchor="middle" className={styles.microLabel}>REQUEST #{state.activeRequest ?? "—"}</text>
          </g>
          <g className={`${styles.node} ${styles.cacheNode} ${isActive(state.phase, ["cache-check", "hit-response", "cache-update"]) ? styles.activeNode : ""}`} transform="translate(330 190)">
            <rect width="140" height="110" rx="22" /><text x="70" y="42" textAnchor="middle" className={styles.nodeIcon}>C</text><text x="70" y="69" textAnchor="middle">Cache</text><text x="70" y="91" textAnchor="middle" className={styles.microLabel}>{cacheStatus} · AGE {state.cacheAge}s</text>
          </g>
          <g className={`${styles.node} ${styles.responseNode} ${state.phase === "hit-response" ? styles.activeNode : ""}`} transform="translate(770 165)">
            <rect width="120" height="90" rx="18" /><text x="60" y="38" textAnchor="middle">HIT</text><text x="60" y="61" textAnchor="middle" className={styles.microLabel}>CACHE RESPONSE</text><circle cx="60" cy="75" r="4" />
          </g>
          <g className={`${styles.node} ${styles.databaseNode} ${isActive(state.phase, ["database", "cache-update"]) ? styles.activeNode : ""}`} transform="translate(660 330)">
            <rect width="140" height="100" rx="5" /><text x="70" y="40" textAnchor="middle" className={styles.nodeIcon}>D</text><text x="70" y="68" textAnchor="middle">Database</text><text x="70" y="86" textAnchor="middle" className={styles.microLabel}>PERSISTENT STORE</text>
          </g>
          <g className={styles.pathLabels}>
            <text x="590" y="118">HIT RESPONSE · SOLID</text><text x="505" y="348">MISS · DASHED</text><text x="510" y="282">CACHE UPDATE</text>
          </g>
        </svg>
      </div>

      <div className={styles.controls} aria-label="シナリオ操作">
        <div className={styles.transport}>
          <button type="button" onClick={() => dispatch({ type: "start" })} disabled={state.playback === "running" || state.playback === "completed"}>▶ Start</button>
          <button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Ⅱ Pause</button>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>↺ Reset</button>
        </div>
        <label><span>Cache state</span><select aria-label="Cache状態" value={state.cachePreset} disabled={settingsDisabled} onChange={(event) => dispatch({ type: "set-cache", cachePreset: event.target.value as CachePreset })}>{CACHE_PRESETS.map((preset) => <option key={preset} value={preset}>{PRESET_LABELS[preset]}</option>)}</select></label>
        <label><span>TTL <output>{state.ttl} sec</output></span><input aria-label="TTL" type="range" min="1" max="5" value={state.ttl} disabled={settingsDisabled} onChange={(event) => dispatch({ type: "set-ttl", ttl: Number(event.target.value) })} /></label>
        <label><span>Request repeat <output>{state.requestCount}</output></span><input aria-label="Requestの繰り返し" type="range" min="1" max="6" value={state.requestCount} disabled={settingsDisabled} onChange={(event) => dispatch({ type: "set-request-count", requestCount: Number(event.target.value) })} /></label>
      </div>

      <div className={styles.results}>
        <div><span>PROGRESS</span><strong>{state.completedRequests} / {state.requestCount}</strong></div>
        <div><span>HIT</span><strong>● {state.hits}</strong></div>
        <div><span>MISS</span><strong>◆ {state.misses}</strong></div>
        <div><span>DB READ</span><strong>{state.databaseReads}</strong></div>
        <p><strong>Why Data &amp; Storage?</strong> データをどこから読み、TTLで鮮度をどう判断し、永続Storeの結果をどう再利用するかが中心課題だからです。すべて説明用の合成データで、実環境には接続しません。</p>
      </div>
    </section>
  );
}

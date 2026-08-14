"use client";

import { useReducer, useState } from "react";
import { DNS_TTL_SECONDS, MAX_FAILED_CONNECTIONS, dnsScenarioReducer, getChallengeScore, getGuidedNextAction, initialDnsScenarioState, type DnsActionName, type DnsMode } from "@/lib/scenarios/traffic-routing/dns-resolution-and-failover/dns-resolution-and-failover-scenario";
import styles from "./dns-resolution-and-failover-demo.module.css";

const actionLabels: Record<DnsActionName, string> = { "inject-failure": "障害を注入", "advance-ttl": "TTLを10秒進める", failover: "SecondaryへFailover", connect: "名前解決して接続" };

export function DnsResolutionAndFailoverDemo() {
  const [state, dispatch] = useReducer(dnsScenarioReducer, initialDnsScenarioState);
  const [selectedMode, setSelectedMode] = useState<DnsMode>("guided");
  const nextAction = getGuidedNextAction(state);
  const score = getChallengeScore(state);
  const isActive = state.playback === "running" && state.outcome === "playing";
  const resolvedEndpoint = state.cachedRecord ?? state.authoritativeRecord;

  return (
    <section className={styles.game} aria-labelledby="dns-game-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>TRAFFIC &amp; ROUTING MINI GAME</p><h2 id="dns-game-title">DNSレスキュー</h2><p className={styles.lead}>名前解決管制官として、Clientを到達可能なEndpointへ導こう。</p></div>
        <div className={styles.missionState} data-outcome={state.outcome}><span>MISSION</span><strong>{state.outcome === "won" ? "成功" : state.outcome === "lost" ? "失敗" : state.playback === "idle" ? "待機" : state.playback === "paused" ? "一時停止" : "進行中"}</strong></div>
      </header>

      <div className={styles.briefing} aria-label="ミッション概要">
        <div><span>役割</span><strong>名前解決管制官</strong></div><div><span>目的</span><strong>通信をSecondaryへ復旧</strong></div><div><span>勝利</span><strong>TTLを読み、到達に成功</strong></div><div><span>失敗</span><strong>到達不能が{MAX_FAILED_CONNECTIONS}回</strong></div>
      </div>

      {state.playback === "idle" && <div className={styles.modePicker}>
        <fieldset><legend>プレイモード</legend>
          <label className={selectedMode === "guided" ? styles.selectedMode : undefined}><input type="radio" name="mode" checked={selectedMode === "guided"} onChange={() => setSelectedMode("guided")} /><span><strong>Guided</strong><small>次の操作と判断理由を段階表示</small></span></label>
          <label className={selectedMode === "challenge" ? styles.selectedMode : undefined}><input type="radio" name="mode" checked={selectedMode === "challenge"} onChange={() => setSelectedMode("challenge")} /><span><strong>Challenge</strong><small>正確性・可用性・安全性で採点</small></span></label>
        </fieldset><button className={styles.primaryButton} type="button" onClick={() => dispatch({ type: "start", mode: selectedMode })}>ゲーム開始</button>
      </div>}

      <div className={styles.dashboard}>
        <div className={styles.objective}><span>現在の目標</span><strong>{state.primaryStatus === "healthy" ? "Primary障害から救助を開始する" : state.outcome === "playing" ? "Secondaryで通信を復旧する" : "Resetして再挑戦できる"}</strong><p>残り失敗許容: {Math.max(0, MAX_FAILED_CONNECTIONS - state.failedConnections)}回 ／ TTL残り: {state.ttlRemaining}秒</p></div>
        {state.mode === "challenge" && state.playback !== "idle" && <div className={styles.score} aria-label={`現在の評価 ${score.total}点`}><span>評価</span><strong>{score.total}</strong><small>正確性 {score.accuracy} · 可用性 {score.availability} · 安全性 {score.safety}</small></div>}
      </div>

      <div className={`${styles.feedback} ${styles[state.feedback.kind]}`} role="status" aria-live="polite"><span aria-hidden="true">{state.feedback.kind === "success" ? "✓" : state.feedback.kind === "failure" ? "!" : state.feedback.kind === "warning" ? "△" : "i"}</span><div><strong>{state.feedback.title}</strong><p>{state.feedback.detail}</p></div></div>
      {state.mode === "guided" && state.playback !== "idle" && state.outcome === "playing" && nextAction && <aside className={styles.guide} aria-label="Guidedモードのヒント"><span>GUIDE {state.actionsTaken + 1}</span><p>次の判断: <strong>{actionLabels[nextAction]}</strong></p></aside>}

      <div className={styles.network} aria-label="DNS経路の現在状態">
        <article><span className={styles.shapeCircle} aria-hidden="true">C</span><small>REQUESTER</small><strong>Client</strong><p>接続先: {resolvedEndpoint === "primary" ? "Primary" : "Secondary"}</p></article><span className={styles.arrow} aria-hidden="true">→</span>
        <article><span className={styles.shapeHex} aria-hidden="true">DNS</span><small>RESOLVER CACHE</small><strong>{state.cachedRecord ? (state.cachedRecord === "primary" ? "Primary" : "Secondary") : "EMPTY"}</strong><p>TTL {state.ttlRemaining}/{DNS_TTL_SECONDS}秒</p></article><span className={styles.arrow} aria-hidden="true">→</span>
        <article><span className={styles.shapeDiamond} aria-hidden="true">A</span><small>AUTHORITATIVE</small><strong>{state.authoritativeRecord === "primary" ? "Primary" : "Secondary"}</strong><p>最新のDNSレコード</p></article><span className={styles.branch} aria-hidden="true">⇢</span>
        <div className={styles.endpoints}><article className={state.primaryStatus === "down" ? styles.endpointDown : styles.endpointHealthy}><small>■ PRIMARY</small><strong>{state.primaryStatus === "down" ? "到達不能" : "正常"}</strong></article><article className={styles.endpointStandby}><small>▲ SECONDARY</small><strong>到達可能</strong></article></div>
      </div>

      <div className={styles.controls} aria-label="ゲーム操作"><div><button type="button" onClick={() => dispatch({ type: "start", mode: state.mode })} disabled={state.playback !== "paused" || state.outcome !== "playing"}>Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={state.playback !== "running"}>Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>Reset</button></div>
        <div>{(Object.keys(actionLabels) as DnsActionName[]).map((action) => <button key={action} type="button" className={nextAction === action && state.mode === "guided" ? styles.recommended : action === "inject-failure" ? styles.danger : undefined} onClick={() => dispatch({ type: action })} disabled={!isActive || (action === "inject-failure" && state.primaryStatus === "down") || (action === "failover" && state.authoritativeRecord === "secondary") || (action === "advance-ttl" && state.cachedRecord === null)}>{actionLabels[action]}</button>)}</div>
      </div>

      {state.outcome !== "playing" && <div className={styles.result}><p>{state.outcome === "won" ? "到達可能なSecondaryへClientを救助しました。" : "TTLと権威レコードの両方を確認して再挑戦しましょう。"}</p>{state.mode === "challenge" && <strong>最終評価 {score.total}点 — 正確性 {score.accuracy} / 可用性 {score.availability} / 安全性 {score.safety}</strong>}<button type="button" onClick={() => dispatch({ type: "reset" })}>同じシナリオでもう一度</button></div>}
      <footer className={styles.disclaimer}><strong>SAFE SYNTHETIC SANDBOX</strong><p>実クラウドや実DNSには接続しません。Endpoint、TTL、所要時間、評価は学習用の合成値で、性能や可用性を保証するものではありません。</p></footer>
    </section>
  );
}

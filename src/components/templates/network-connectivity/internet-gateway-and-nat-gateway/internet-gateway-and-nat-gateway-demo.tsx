"use client";

import { useReducer } from "react";
import { gatewayGameReducer, getGuidance, initialGatewayGameState, ROUNDS, type GatewayChoice, type GatewayGameState } from "@/lib/scenarios/network-connectivity/internet-gateway-and-nat-gateway/internet-gateway-and-nat-gateway-scenario";
import styles from "./internet-gateway-and-nat-gateway-demo.module.css";

const gateways: readonly [GatewayChoice, string, string][] = [
  ["internetGateway", "Internet Gateway", "公開境界の入口 / 出口"],
  ["natGateway", "NAT Gateway", "Private 側の Egress 中継"],
  ["direct", "直接経路を試す", "Gateway を経由しない危険な経路"],
];

export function InternetGatewayAndNatGatewayDemo() {
  const [state, dispatch] = useReducer(gatewayGameReducer, initialGatewayGameState);
  const round = ROUNDS[state.roundIndex];
  const ended = state.phase === "won" || state.phase === "lost";
  const active = state.phase === "playing";

  return (
    <section className={styles.game} aria-labelledby="game-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>NETWORK &amp; CONNECTIVITY · FIXED SCENARIO</p><h2 id="game-title">イングレス・エグレス管制</h2><p>Gateway 管制官として、通信方向と通過させる Gateway を判断してください。</p></div>
        <dl className={styles.mission}><div><dt>役割</dt><dd>Gateway 管制官</dd></div><div><dt>勝利</dt><dd>Public ingress と Private egress を成立</dd></div><div><dt>失敗</dt><dd>Private Resource への直接 ingress</dd></div></dl>
      </header>

      <div className={styles.modeBar} aria-label="ゲームモード">
        {(["guided", "challenge"] as const).map((mode) => <button key={mode} type="button" aria-pressed={state.mode === mode} onClick={() => dispatch({ type: "set-mode", mode })}>{mode === "guided" ? "Guided · ヒントあり" : "Challenge · 採点あり"}</button>)}
        <p>評価軸: 正確性 100点 × 3 / 安全違反 −40点</p>
      </div>

      <div className={styles.statusBar} aria-live="polite"><span>ROUND {state.roundIndex + 1} / {ROUNDS.length}</span><span>正解 {state.correctAnswers} / {ROUNDS.length}</span><span>安全違反 {state.safetyViolations}</span><strong>{state.score} pts</strong></div>

      <div className={styles.board}>
        {ended ? <Result state={state} onReset={() => dispatch({ type: "reset" })} /> : <>
          <section className={styles.briefing} aria-labelledby="current-goal"><p className={styles.eyebrow}>CURRENT GOAL</p><h3 id="current-goal">{round.request}</h3><div className={styles.flow}><span>● {round.source}</span><span aria-hidden="true">- - - ? - - - →</span><span>■ {round.destination}</span></div><p>残り条件: 通信方向と Gateway を選択し、安全に管制する</p></section>

          <div className={styles.decisionGrid}>
            <fieldset disabled={!active}><legend>1. 通信方向</legend><Choice pressed={state.direction === "ingress"} onClick={() => dispatch({ type: "select-direction", direction: "ingress" })} label="↓ Ingress" note="外部から入る" /><Choice pressed={state.direction === "egress"} onClick={() => dispatch({ type: "select-direction", direction: "egress" })} label="↑ Egress" note="内部から出る" /></fieldset>
            <fieldset disabled={!active}><legend>2. Gateway</legend>{gateways.map(([id, label, note]) => <Choice key={id} pressed={state.gateway === id} onClick={() => dispatch({ type: "select-gateway", gateway: id })} label={label} note={note} danger={id === "direct"} />)}</fieldset>
          </div>

          {state.mode === "guided" && !state.lastResult && <aside className={styles.guide}><strong>GUIDED HINT</strong><p>{getGuidance(state)}</p></aside>}
          {state.lastResult && <aside className={`${styles.feedback} ${state.lastResult.safe ? styles.safe : styles.unsafe}`} role="status"><strong>{state.lastResult.correct ? "✓" : "!"} {state.lastResult.title}</strong><p>{state.lastResult.explanation}</p><p className={styles.textState}>状態: {state.lastResult.safe ? "境界を保護" : "Private 境界を侵害"} / 結果: {state.lastResult.correct ? "正解" : "不正解"}</p></aside>}
        </>}
      </div>

      {!ended && <footer className={styles.controls} aria-label="ゲーム操作"><button type="button" onClick={() => dispatch({ type: "start" })} disabled={active || state.phase === "feedback"}>Start</button><button type="button" onClick={() => dispatch({ type: "pause" })} disabled={!active}>Pause</button><button type="button" onClick={() => dispatch({ type: "reset" })}>Reset</button>{active && <button className={styles.primary} type="button" onClick={() => dispatch({ type: "submit" })} disabled={!state.direction || !state.gateway}>管制を実行</button>}{state.phase === "feedback" && <button className={styles.primary} type="button" onClick={() => dispatch({ type: "next" })}>{state.roundIndex === ROUNDS.length - 1 ? "結果を見る" : "次のラウンド"}</button>}</footer>}
      <p className={styles.disclaimer}>このゲームはベンダーニュートラルな合成シナリオです。表示値は説明用で、実クラウドや実データへ接続・操作せず、性能・安全性を保証しません。</p>
    </section>
  );
}

function Choice({ pressed, onClick, label, note, danger = false }: { pressed: boolean; onClick: () => void; label: string; note: string; danger?: boolean }) { return <button type="button" className={danger ? styles.dangerChoice : ""} aria-pressed={pressed} onClick={onClick}><strong>{label}</strong><small>{note}</small></button>; }

function Result({ state, onReset }: { state: GatewayGameState; onReset: () => void }) {
  const won = state.phase === "won";
  return <section className={styles.result} role="status"><span aria-hidden="true">{won ? "◎" : "△"}</span><p className={styles.eyebrow}>MISSION RESULT</p><h3>{won ? "管制成功" : "再訓練が必要です"}</h3><p>{won ? "Public ingress と Private egress を成立させ、Private 境界を保護しました。" : "経路の不成立または安全違反がありました。理由を確認して同じ固定シナリオへ再挑戦しましょう。"}</p><dl><div><dt>正確性</dt><dd>{state.correctAnswers} / {ROUNDS.length}</dd></div><div><dt>安全性</dt><dd>{state.safetyViolations === 0 ? "違反なし" : `${state.safetyViolations} 件の違反`}</dd></div><div><dt>Score</dt><dd>{state.score} pts</dd></div></dl><button type="button" onClick={onReset}>同じシナリオへ再挑戦</button></section>;
}

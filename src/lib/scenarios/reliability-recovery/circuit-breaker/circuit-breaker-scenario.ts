export type CircuitState = "closed" | "open" | "half-open";
export type Playback = "idle" | "running" | "paused";
export interface CircuitBreakerState { playback: Playback; circuit: CircuitState; injectFailure: boolean; failureThreshold: number; recoveryTrials: number; consecutiveFailures: number; successfulTrials: number; cooldownRemaining: number; forwardedRequests: number; blockedRequests: number; completedRecoveries: number; decision: string; lastTransition: string; }
export type CircuitBreakerAction = { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" } | { type: "set-failure-injection"; value: boolean } | { type: "set-threshold"; value: number } | { type: "set-recovery-trials"; value: number };
export const OPEN_COOLDOWN_TICKS = 3;
export const initialCircuitBreakerState: CircuitBreakerState = { playback: "idle", circuit: "closed", injectFailure: false, failureThreshold: 3, recoveryTrials: 2, consecutiveFailures: 0, successfulTrials: 0, cooldownRemaining: 0, forwardedRequests: 0, blockedRequests: 0, completedRecoveries: 0, decision: "初期状態: Closed。リクエストを依存先へ転送できます。", lastTransition: "Synthetic reset → Closed" };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

function tickClosed(state: CircuitBreakerState): CircuitBreakerState {
  const forwardedRequests = state.forwardedRequests + 1;
  if (!state.injectFailure) return { ...state, forwardedRequests, consecutiveFailures: 0, decision: "依存先が成功を返しました。失敗カウントを 0 に戻し、Closed を維持します。" };
  const failures = state.consecutiveFailures + 1;
  if (failures < state.failureThreshold) return { ...state, forwardedRequests, consecutiveFailures: failures, decision: `失敗 ${failures}/${state.failureThreshold}。閾値未満のため Closed を維持します。` };
  return { ...state, circuit: "open", forwardedRequests, consecutiveFailures: failures, cooldownRemaining: OPEN_COOLDOWN_TICKS, decision: `失敗が閾値 ${state.failureThreshold} に到達しました。Open にして依存先を保護します。`, lastTransition: "Closed → Open" };
}
function tickOpen(state: CircuitBreakerState): CircuitBreakerState {
  const blockedRequests = state.blockedRequests + 1;
  if (state.cooldownRemaining > 1) { const remaining = state.cooldownRemaining - 1; return { ...state, blockedRequests, cooldownRemaining: remaining, decision: `Open: リクエストを遮断中です。回復確認まであと ${remaining} tick。` }; }
  return { ...state, circuit: "half-open", blockedRequests, cooldownRemaining: 0, successfulTrials: 0, decision: `待機完了。Half-open で最大 ${state.recoveryTrials} 回の回復試行を許可します。`, lastTransition: "Open → Half-open" };
}
function tickHalfOpen(state: CircuitBreakerState): CircuitBreakerState {
  const forwardedRequests = state.forwardedRequests + 1;
  if (state.injectFailure) return { ...state, circuit: "open", forwardedRequests, successfulTrials: 0, cooldownRemaining: OPEN_COOLDOWN_TICKS, decision: "回復試行が失敗しました。直ちに Open へ戻して依存先を保護します。", lastTransition: "Half-open → Open" };
  const successfulTrials = state.successfulTrials + 1;
  if (successfulTrials < state.recoveryTrials) return { ...state, forwardedRequests, successfulTrials, decision: `回復試行 ${successfulTrials}/${state.recoveryTrials} が成功。Half-open で確認を続けます。` };
  return { ...state, circuit: "closed", forwardedRequests, consecutiveFailures: 0, successfulTrials, completedRecoveries: state.completedRecoveries + 1, decision: `回復試行 ${state.recoveryTrials} 回が成功しました。Closed に戻して通常転送を再開します。`, lastTransition: "Half-open → Closed (recovered)" };
}
export function circuitBreakerReducer(state: CircuitBreakerState, action: CircuitBreakerAction): CircuitBreakerState {
  switch (action.type) {
    case "start": return state.playback === "running" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialCircuitBreakerState;
    case "set-failure-injection": return { ...state, injectFailure: action.value, decision: action.value ? "失敗注入を有効化しました。次の転送は失敗します。" : "失敗注入を停止しました。次の転送は成功します。" };
    case "set-threshold": return { ...state, failureThreshold: clamp(action.value, 1, 5), consecutiveFailures: 0 };
    case "set-recovery-trials": return { ...state, recoveryTrials: clamp(action.value, 1, 4), successfulTrials: 0 };
    case "tick": if (state.playback !== "running") return state; if (state.circuit === "closed") return tickClosed(state); if (state.circuit === "open") return tickOpen(state); return tickHalfOpen(state);
  }
}
export const circuitStateDescriptions: Record<CircuitState, { label: string; detail: string }> = { closed: { label: "CLOSED", detail: "通常転送。失敗を数えて閾値と比較します。" }, open: { label: "OPEN", detail: "転送を遮断し、依存先へ負荷を掛けずに待機します。" }, "half-open": { label: "HALF-OPEN", detail: "限定した回復試行だけを転送し、復旧を判定します。" } };

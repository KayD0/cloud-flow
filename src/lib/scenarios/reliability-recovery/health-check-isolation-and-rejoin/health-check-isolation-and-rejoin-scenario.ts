export const HEALTH_STAGES = ["healthy", "warning", "down", "isolated", "recovered", "healthy-again"] as const;
export type HealthStage = (typeof HEALTH_STAGES)[number];

export interface HealthCheckState {
  playback: "idle" | "running" | "paused" | "completed";
  stage: HealthStage;
  failureInjected: boolean;
  failureThreshold: 2 | 3 | 4;
  failedChecks: number;
  recoveryChecks: number;
  recoveryRequested: boolean;
  eventCount: number;
}

export type HealthCheckAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-failure"; enabled: boolean }
  | { type: "set-threshold"; threshold: 2 | 3 | 4 }
  | { type: "recover" };

export const initialHealthCheckState: HealthCheckState = {
  playback: "idle", stage: "healthy", failureInjected: true, failureThreshold: 3,
  failedChecks: 0, recoveryChecks: 0, recoveryRequested: false, eventCount: 0,
};

function tick(state: HealthCheckState): HealthCheckState {
  if (state.playback !== "running") return state;
  const eventCount = state.eventCount + 1;
  if (state.stage === "healthy") {
    if (!state.failureInjected) return { ...state, playback: "completed", eventCount };
    return { ...state, stage: "warning", failedChecks: 1, eventCount };
  }
  if (state.stage === "warning") {
    const failedChecks = state.failedChecks + 1;
    return failedChecks >= state.failureThreshold
      ? { ...state, stage: "down", failedChecks, eventCount }
      : { ...state, failedChecks, eventCount };
  }
  if (state.stage === "down") return { ...state, stage: "isolated", eventCount };
  if (state.stage === "isolated") return state.recoveryRequested
    ? { ...state, stage: "recovered", recoveryChecks: 1, eventCount }
    : { ...state, playback: "paused", eventCount };
  if (state.stage === "recovered") {
    const recoveryChecks = state.recoveryChecks + 1;
    return recoveryChecks >= 2
      ? { ...state, stage: "healthy-again", playback: "completed", recoveryChecks, eventCount }
      : { ...state, recoveryChecks, eventCount };
  }
  return state;
}

export function healthCheckReducer(state: HealthCheckState, action: HealthCheckAction): HealthCheckState {
  switch (action.type) {
    case "start": return state.playback === "completed" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialHealthCheckState;
    case "tick": return tick(state);
    case "set-failure": return { ...initialHealthCheckState, failureInjected: action.enabled, failureThreshold: state.failureThreshold };
    case "set-threshold": return { ...initialHealthCheckState, failureInjected: state.failureInjected, failureThreshold: action.threshold };
    case "recover": return state.stage === "isolated" ? { ...state, recoveryRequested: true, playback: "running" } : state;
  }
}

export const stageDetails: Record<HealthStage, { label: string; reason: string }> = {
  healthy: { label: "Healthy", reason: "Node は Health Check に応答し、合成トラフィックを処理しています。" },
  warning: { label: "Warning", reason: "失敗を検出しました。単発の揺らぎを隔離しないよう、連続失敗を数えています。" },
  down: { label: "Down", reason: "連続失敗が判定回数に達しました。Node を Down と判定します。" },
  isolated: { label: "Isolated", reason: "異常な Node を合成トラフィック経路から外しました。回復操作を待っています。" },
  recovered: { label: "Recovered", reason: "応答が戻りました。すぐ全量復帰せず、再参加前の確認を続けます。" },
  "healthy-again": { label: "Healthy", reason: "回復確認を2回通過し、Node を合成トラフィック経路へ再参加させました。" },
};

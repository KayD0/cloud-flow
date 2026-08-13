export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type FlowPhase = "ready" | "invocation" | "function" | "processing" | "idle";
export type PlaybackSpeed = 0.5 | 1 | 2;

export interface ServerlessScalingState {
  playback: PlaybackState;
  phase: FlowPhase;
  invocationCount: number;
  concurrencyLimit: number;
  speed: PlaybackSpeed;
  completedCount: number;
  batch: number;
}

export type ServerlessScalingAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-invocations"; count: number }
  | { type: "set-concurrency"; count: number }
  | { type: "set-speed"; speed: PlaybackSpeed };

export const initialServerlessScalingState: ServerlessScalingState = {
  playback: "idle", phase: "ready", invocationCount: 8, concurrencyLimit: 3,
  speed: 1, completedCount: 0, batch: 0,
};

export interface ScalingSnapshot {
  activeCount: number;
  queuedCount: number;
  coldCount: number;
  warmCount: number;
  isConstrained: boolean;
}

export function getScalingSnapshot(state: ServerlessScalingState): ScalingSnapshot {
  const remaining = Math.max(0, state.invocationCount - state.completedCount);
  const activeCount = state.phase === "ready" || state.phase === "idle" ? 0 : Math.min(remaining, state.concurrencyLimit);
  const functionVisible = state.phase === "function" || state.phase === "processing";
  const warmCount = functionVisible ? (state.batch === 0 ? Math.min(1, activeCount) : activeCount) : 0;
  const coldCount = functionVisible && state.batch === 0 ? Math.max(0, activeCount - warmCount) : 0;
  return { activeCount, queuedCount: Math.max(0, remaining - activeCount), coldCount, warmCount, isConstrained: remaining > state.concurrencyLimit };
}

function restartWith(state: ServerlessScalingState, change: Partial<ServerlessScalingState>): ServerlessScalingState {
  return { ...state, ...change, playback: "idle", phase: "ready", completedCount: 0, batch: 0 };
}

export function serverlessScalingReducer(state: ServerlessScalingState, action: ServerlessScalingAction): ServerlessScalingState {
  switch (action.type) {
    case "start":
      return state.playback === "completed"
        ? { ...state, playback: "running", phase: "ready", completedCount: 0, batch: 0 }
        : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialServerlessScalingState;
    case "set-invocations": return restartWith(state, { invocationCount: Math.min(18, Math.max(1, action.count)) });
    case "set-concurrency": return restartWith(state, { concurrencyLimit: Math.min(6, Math.max(1, action.count)) });
    case "set-speed": return { ...state, speed: action.speed };
    case "tick": {
      if (state.playback !== "running") return state;
      if (state.phase === "ready") return { ...state, phase: "invocation" };
      if (state.phase === "invocation") return { ...state, phase: "function" };
      if (state.phase === "function") return { ...state, phase: "processing" };
      if (state.phase === "processing") {
        const processed = Math.min(state.concurrencyLimit, state.invocationCount - state.completedCount);
        return { ...state, phase: "idle", completedCount: state.completedCount + processed };
      }
      if (state.completedCount >= state.invocationCount) return { ...state, playback: "completed" };
      return { ...state, phase: "invocation", batch: state.batch + 1 };
    }
  }
}

export function getStateExplanation(state: ServerlessScalingState): string {
  const snapshot = getScalingSnapshot(state);
  if (state.playback === "completed") return `全 ${state.invocationCount} 件を処理し、Function は Idle になりました。実環境への作用はありません。`;
  if (state.playback === "paused") return "一時停止中です。Start で現在の状態から再開できます。";
  if (state.phase === "ready") return "合成した Invocation の到着前です。Start でスケーリングの判断を追跡します。";
  if (state.phase === "invocation") return snapshot.isConstrained
    ? `同時実行上限 ${state.concurrencyLimit} を超えた ${snapshot.queuedCount} 件は、次の空き枠まで待機します。`
    : "すべての Invocation を現在の同時実行枠へ割り当てられます。";
  if (state.phase === "function") return snapshot.coldCount > 0
    ? `Warm Function ${snapshot.warmCount} 個を再利用し、不足する ${snapshot.coldCount} 個を Cold Start します。`
    : `Idle だった Warm Function ${snapshot.warmCount} 個を再利用し、Cold Start を避けます。`;
  if (state.phase === "processing") return `${snapshot.activeCount} 個の Function が並行処理中です。上限を超えて Function は増えません。`;
  return state.completedCount >= state.invocationCount
    ? "最後の処理が完了し、Function は Idle です。次の tick で完了状態になります。"
    : `${state.completedCount} 件が完了しました。Function を Idle に戻し、待機中の Invocation に再利用します。`;
}

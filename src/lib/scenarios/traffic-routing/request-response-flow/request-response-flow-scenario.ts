export const FLOW_STAGES = [
  { id: "ready", label: "Ready", detail: "合成 Request は Client で待機しています。Start または Step で送信します。" },
  { id: "request-gateway", label: "Request → Gateway", detail: "Gateway が Request を受け取り、Backend への経路を選択します。" },
  { id: "request-backend", label: "Request → Backend", detail: "Backend が合成 Request を処理しています。" },
  { id: "response-gateway", label: "Response → Gateway", detail: "Backend の Response が Gateway を経由して Client へ戻ります。" },
  { id: "response-client", label: "Response → Client", detail: "Client が Response を受信しました。往復通信は完了です。" },
] as const;

export type PlaybackState = "idle" | "running" | "paused" | "completed" | "failed";
export type DelayMode = "normal" | "slow";

export interface RequestResponseFlowState {
  playback: PlaybackState;
  stageIndex: number;
  delayMode: DelayMode;
  backendTimeout: boolean;
}

export type RequestResponseFlowAction =
  | { type: "start" } | { type: "pause" } | { type: "step" } | { type: "tick" }
  | { type: "reset" } | { type: "set-delay"; delayMode: DelayMode }
  | { type: "set-backend-timeout"; enabled: boolean };

export const initialRequestResponseFlowState: RequestResponseFlowState = {
  playback: "idle", stageIndex: 0, delayMode: "normal", backendTimeout: false,
};

export const delayMilliseconds: Record<DelayMode, number> = { normal: 900, slow: 1800 };

export function getCurrentStage(state: RequestResponseFlowState) {
  return FLOW_STAGES[state.stageIndex];
}

function advance(state: RequestResponseFlowState, automatic: boolean): RequestResponseFlowState {
  if (state.playback === "completed" || state.playback === "failed") return state;
  if (state.backendTimeout && state.stageIndex === 2) return { ...state, playback: "failed" };
  const stageIndex = Math.min(state.stageIndex + 1, FLOW_STAGES.length - 1);
  return {
    ...state, stageIndex,
    playback: stageIndex === FLOW_STAGES.length - 1 ? "completed" : automatic ? "running" : "paused",
  };
}

export function requestResponseFlowReducer(state: RequestResponseFlowState, action: RequestResponseFlowAction): RequestResponseFlowState {
  switch (action.type) {
    case "start":
      if (state.playback === "completed" || state.playback === "failed") return state;
      return { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "step": return advance(state, false);
    case "tick": return state.playback === "running" ? advance(state, true) : state;
    case "reset": return initialRequestResponseFlowState;
    case "set-delay": return { ...state, delayMode: action.delayMode };
    case "set-backend-timeout": return { ...state, backendTimeout: action.enabled };
  }
}

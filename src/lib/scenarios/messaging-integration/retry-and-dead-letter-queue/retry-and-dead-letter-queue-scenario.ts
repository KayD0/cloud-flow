export const RETRY_STAGES = [
  { id: "queued", label: "Queued", detail: "合成メッセージ msg-001 は Queue で Consumer の受信を待っています。" },
  { id: "consuming", label: "Consumer processing", detail: "Consumer が msg-001 を処理しています。" },
  { id: "retry-wait", label: "Retry wait", detail: "失敗後すぐに再配送せず、説明用の待機時間を置いています。" },
  { id: "delivered", label: "Delivered", detail: "Consumer の処理が正常に完了しました。" },
  { id: "dlq", label: "Dead Letter Queue", detail: "Retry 上限に達したため、メッセージを DLQ に隔離しました。" },
] as const;

export type RetryStage = (typeof RETRY_STAGES)[number]["id"];
export type RetryPlayback = "idle" | "running" | "paused" | "completed";
export interface RetryDeadLetterState { playback: RetryPlayback; stage: RetryStage; retryLimit: number; retryCount: number; failureInjected: boolean; deliveryCount: number; dlqCount: number; message: string; }
export type RetryDeadLetterAction = { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" } | { type: "set-retry-limit"; retryLimit: number } | { type: "set-failure"; enabled: boolean } | { type: "reprocess-dlq" };

export const initialRetryDeadLetterState: RetryDeadLetterState = { playback: "idle", stage: "queued", retryLimit: 2, retryCount: 0, failureInjected: false, deliveryCount: 0, dlqCount: 0, message: RETRY_STAGES[0].detail };
export const retryTickMilliseconds = 900;
export function getRetryStage(stage: RetryStage) { return RETRY_STAGES.find((item) => item.id === stage)!; }
function clampRetryLimit(value: number) { return Math.min(5, Math.max(0, Math.round(value))); }

export function retryDeadLetterReducer(state: RetryDeadLetterState, action: RetryDeadLetterAction): RetryDeadLetterState {
  switch (action.type) {
    case "start": return state.playback === "completed" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialRetryDeadLetterState;
    case "set-retry-limit": return state.playback === "idle" ? { ...state, retryLimit: clampRetryLimit(action.retryLimit) } : state;
    case "set-failure":
      if (state.playback === "completed") return state;
      return { ...state, failureInjected: action.enabled, message: action.enabled ? "失敗注入を有効にしました。Consumer の処理は失敗します。" : "失敗注入を解除しました。次の Consumer 処理は成功します。" };
    case "reprocess-dlq":
      if (state.stage !== "dlq") return state;
      return { ...state, playback: "idle", stage: "queued", retryCount: 0, failureInjected: false, message: "DLQ の msg-001 を Queue に戻しました。失敗注入を解除して再処理を待っています。" };
    case "tick":
      if (state.playback !== "running") return state;
      if (state.stage === "queued") return { ...state, stage: "consuming", message: getRetryStage("consuming").detail };
      if (state.stage === "retry-wait") return { ...state, stage: "consuming", message: `Retry ${state.retryCount}/${state.retryLimit}: Consumer へ再配送しました。` };
      if (state.stage === "consuming") {
        if (!state.failureInjected) return { ...state, playback: "completed", stage: "delivered", deliveryCount: state.deliveryCount + 1, message: getRetryStage("delivered").detail };
        if (state.retryCount < state.retryLimit) {
          const retryCount = state.retryCount + 1;
          return { ...state, stage: "retry-wait", retryCount, message: `Consumer が失敗しました。Retry ${retryCount}/${state.retryLimit} の前に待機します。` };
        }
        return { ...state, playback: "completed", stage: "dlq", dlqCount: state.dlqCount + 1, message: `Consumer が再び失敗し、Retry 上限 ${state.retryLimit} 回に達したため DLQ へ移動しました。` };
      }
      return state;
  }
}

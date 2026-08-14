export type RetryPlayback = "idle" | "running" | "paused" | "completed";
export type RetryPhase = "request" | "timeout" | "backoff" | "retry" | "success" | "give-up";

export interface TimeoutAndBoundedRetryState {
  playback: RetryPlayback;
  phase: RetryPhase;
  serviceDelayMs: number;
  timeoutMs: number;
  maxAttempts: number;
  attempt: number;
}

export type TimeoutAndBoundedRetryAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-service-delay"; value: number }
  | { type: "set-timeout"; value: number }
  | { type: "set-max-attempts"; value: number };

export const RETRY_PHASES: readonly RetryPhase[] = [
  "request", "timeout", "backoff", "retry", "success", "give-up",
];

export const initialTimeoutAndBoundedRetryState: TimeoutAndBoundedRetryState = {
  playback: "idle",
  phase: "request",
  serviceDelayMs: 1_400,
  timeoutMs: 800,
  maxAttempts: 3,
  attempt: 1,
};

function clamp(value: number, minimum: number, maximum: number, step: number) {
  const rounded = Math.round(value / step) * step;
  return Math.min(maximum, Math.max(minimum, rounded));
}

export function effectiveDelayMs(state: TimeoutAndBoundedRetryState) {
  return Math.max(100, state.serviceDelayMs - (state.attempt - 1) * 400);
}

export function backoffMs(attempt: number) {
  return 300 * 2 ** Math.max(0, attempt - 1);
}

function tick(state: TimeoutAndBoundedRetryState): TimeoutAndBoundedRetryState {
  if (state.playback !== "running") return state;

  switch (state.phase) {
    case "request":
      return effectiveDelayMs(state) <= state.timeoutMs
        ? { ...state, phase: "success", playback: "completed" }
        : { ...state, phase: "timeout" };
    case "timeout":
      return { ...state, phase: "backoff" };
    case "backoff":
      return { ...state, phase: "retry" };
    case "retry":
      return state.attempt >= state.maxAttempts
        ? { ...state, phase: "give-up", playback: "completed" }
        : { ...state, phase: "request", attempt: state.attempt + 1 };
    case "success":
    case "give-up":
      return state;
  }
}

export function timeoutAndBoundedRetryReducer(
  state: TimeoutAndBoundedRetryState,
  action: TimeoutAndBoundedRetryAction,
): TimeoutAndBoundedRetryState {
  switch (action.type) {
    case "start":
      return state.playback === "completed" ? state : { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialTimeoutAndBoundedRetryState;
    case "tick":
      return tick(state);
    case "set-service-delay":
      return state.playback === "idle" ? { ...state, serviceDelayMs: clamp(action.value, 400, 2_000, 100) } : state;
    case "set-timeout":
      return state.playback === "idle" ? { ...state, timeoutMs: clamp(action.value, 300, 1_500, 100) } : state;
    case "set-max-attempts":
      return state.playback === "idle" ? { ...state, maxAttempts: clamp(action.value, 1, 5, 1) } : state;
  }
}

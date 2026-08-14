export type GameMode = "guided" | "challenge";
export type GamePhase = "setup" | "running" | "paused" | "won" | "failed";

export const TARGET_CANARY_WEIGHT = 20;
export const ALLOCATION_TOLERANCE = 5;
export const FAILURE_RATE_LIMIT = 15;
export const REQUEST_COUNT = 20;

export interface RouteEvaluation {
  outcome: "won" | "failed";
  canaryWeight: number;
  stableWeight: number;
  allocationError: number;
  canaryFailureRate: number;
  delivered: { stable: number; canary: number; failed: number };
  score: { accuracy: number; safety: number; availability: number; total: number };
  reason: string;
}

export interface WeightedRoutingState {
  mode: GameMode;
  phase: GamePhase;
  canaryWeight: number;
  dispatched: number;
  result: RouteEvaluation | null;
}

export type WeightedRoutingAction =
  | { type: "select-mode"; mode: GameMode }
  | { type: "set-canary-weight"; weight: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" };

export const initialWeightedRoutingState: WeightedRoutingState = {
  mode: "guided",
  phase: "setup",
  canaryWeight: 10,
  dispatched: 0,
  result: null,
};

const clampWeight = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function evaluateRoute(canaryWeightInput: number): RouteEvaluation {
  const canaryWeight = clampWeight(canaryWeightInput);
  const stableWeight = 100 - canaryWeight;
  const allocationError = Math.abs(TARGET_CANARY_WEIGHT - canaryWeight);
  // Fixed synthetic scenario: wider exposure reveals more failures in the canary.
  const canaryFailureRate = Math.round((4 + Math.max(0, canaryWeight - TARGET_CANARY_WEIGHT) * 0.6) * 10) / 10;
  const canaryRequests = Math.round((REQUEST_COUNT * canaryWeight) / 100);
  const failed = Math.round((canaryRequests * canaryFailureRate) / 100);
  const won = allocationError <= ALLOCATION_TOLERANCE && canaryFailureRate <= FAILURE_RATE_LIMIT;
  const accuracy = Math.max(0, 100 - allocationError * 5);
  const safety = Math.max(0, Math.round(100 - Math.max(0, canaryFailureRate - 4) * 4));
  const availability = Math.round(((REQUEST_COUNT - failed) / REQUEST_COUNT) * 100);
  const total = Math.round(accuracy * 0.45 + safety * 0.35 + availability * 0.2);

  return {
    outcome: won ? "won" : "failed",
    canaryWeight,
    stableWeight,
    allocationError,
    canaryFailureRate,
    delivered: { stable: REQUEST_COUNT - canaryRequests, canary: canaryRequests - failed, failed },
    score: { accuracy, safety, availability, total },
    reason: won
      ? "目標配分の許容範囲を守りながら、Canary の障害率を安全上限以下に抑えました。小さな利用者群で変更を検証できています。"
      : canaryFailureRate > FAILURE_RATE_LIMIT
        ? "Canary へ一度に多く配分したため、問題のある変更へ送られるリクエストが増え、合成障害率が安全上限を超えました。"
        : "Canary の障害率は安全範囲ですが、目標比率からの配分誤差が許容値を超えました。重みは配送割合へ直接影響します。",
  };
}

export function weightedRoutingReducer(state: WeightedRoutingState, action: WeightedRoutingAction): WeightedRoutingState {
  switch (action.type) {
    case "select-mode":
      return state.phase === "setup" ? { ...state, mode: action.mode } : state;
    case "set-canary-weight":
      return state.phase === "setup" || state.phase === "paused"
        ? { ...state, canaryWeight: clampWeight(action.weight), result: null }
        : state;
    case "start":
      return state.phase === "setup" || state.phase === "paused" ? { ...state, phase: "running", result: null } : state;
    case "pause":
      return state.phase === "running" ? { ...state, phase: "paused" } : state;
    case "reset":
      return initialWeightedRoutingState;
    case "tick": {
      if (state.phase !== "running") return state;
      const dispatched = Math.min(REQUEST_COUNT, state.dispatched + 1);
      if (dispatched < REQUEST_COUNT) return { ...state, dispatched };
      const result = evaluateRoute(state.canaryWeight);
      return { ...state, dispatched, result, phase: result.outcome };
    }
  }
}

export const DESTINATIONS = ["stable", "canary"] as const;
export type Destination = (typeof DESTINATIONS)[number];
export type Playback = "idle" | "running" | "paused" | "completed";

export interface WeightedRequest {
  id: number;
  target: Destination;
  progress: number;
}

export interface WeightedRoutingState {
  playback: Playback;
  weights: Record<Destination, number>;
  requestCount: number;
  dispatchedRequests: number;
  completed: Record<Destination, number>;
  requests: readonly WeightedRequest[];
  scores: Record<Destination, number>;
}

export type WeightedRoutingAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-weight"; destination: Destination; weight: number }
  | { type: "set-request-count"; requestCount: number }
  | { type: "tick" };

export const initialWeightedRoutingState: WeightedRoutingState = {
  playback: "idle",
  weights: { stable: 90, canary: 10 },
  requestCount: 20,
  dispatchedRequests: 0,
  completed: { stable: 0, canary: 0 },
  requests: [],
  scores: { stable: 0, canary: 0 },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function chooseDestination(state: WeightedRoutingState) {
  const totalWeight = state.weights.stable + state.weights.canary;
  if (totalWeight === 0) return undefined;

  const scores = {
    stable: state.scores.stable + state.weights.stable,
    canary: state.scores.canary + state.weights.canary,
  };
  const target: Destination = scores.stable >= scores.canary ? "stable" : "canary";
  scores[target] -= totalWeight;
  return { target, scores };
}

function tick(state: WeightedRoutingState): WeightedRoutingState {
  if (state.playback !== "running") return state;

  const completed = { ...state.completed };
  const advanced = state.requests
    .map((request) => ({ ...request, progress: request.progress + 0.34 }))
    .filter((request) => {
      if (request.progress < 1) return true;
      completed[request.target] += 1;
      return false;
    });

  if (state.dispatchedRequests >= state.requestCount && advanced.length === 0) {
    return { ...state, playback: "completed", completed, requests: [] };
  }

  const choice = chooseDestination(state);
  if (!choice || state.dispatchedRequests >= state.requestCount) {
    return { ...state, completed, requests: advanced };
  }

  return {
    ...state,
    completed,
    requests: [...advanced, { id: state.dispatchedRequests + 1, target: choice.target, progress: 0 }],
    scores: choice.scores,
    dispatchedRequests: state.dispatchedRequests + 1,
  };
}

export function weightedRoutingReducer(
  state: WeightedRoutingState,
  action: WeightedRoutingAction,
): WeightedRoutingState {
  switch (action.type) {
    case "start":
      if (state.weights.stable + state.weights.canary === 0 || state.playback === "completed") return state;
      return { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialWeightedRoutingState;
    case "set-weight": {
      const weights = { ...state.weights, [action.destination]: clamp(action.weight, 0, 100) };
      return {
        ...state,
        playback: weights.stable + weights.canary === 0 && state.playback === "running" ? "paused" : state.playback,
        weights,
        scores: { stable: 0, canary: 0 },
      };
    }
    case "set-request-count":
      if (state.playback !== "idle") return state;
      return { ...state, requestCount: clamp(action.requestCount, 1, 100) };
    case "tick":
      return tick(state);
  }
}

export type RollingUpdatePlayback = "idle" | "running" | "paused" | "completed";
export type RollingUpdateStage = "current" | "new-replica-set" | "pod-replacement" | "old-retired";

export interface RollingUpdateState {
  playback: RollingUpdatePlayback;
  stage: RollingUpdateStage;
  replicas: number;
  oldReady: number;
  newReady: number;
  oldRetired: number;
}

export type RollingUpdateAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-replicas"; replicas: number }
  | { type: "tick" };

export const DEFAULT_REPLICAS = 4;

export const initialRollingUpdateState: RollingUpdateState = {
  playback: "idle",
  stage: "current",
  replicas: DEFAULT_REPLICAS,
  oldReady: DEFAULT_REPLICAS,
  newReady: 0,
  oldRetired: 0,
};

function clampReplicas(value: number) {
  return Math.min(8, Math.max(1, Math.round(value)));
}

function advance(state: RollingUpdateState): RollingUpdateState {
  if (state.playback !== "running") return state;

  // A new Pod becomes Ready before its paired old Pod can be drained.
  if (state.newReady === state.oldRetired && state.newReady < state.replicas) {
    return { ...state, stage: "new-replica-set", newReady: state.newReady + 1 };
  }

  if (state.oldReady > 0) {
    const oldReady = state.oldReady - 1;
    const oldRetired = state.oldRetired + 1;
    const completed = oldReady === 0 && state.newReady === state.replicas;
    return {
      ...state,
      playback: completed ? "completed" : "running",
      stage: completed ? "old-retired" : "pod-replacement",
      oldReady,
      oldRetired,
    };
  }

  return { ...state, playback: "completed", stage: "old-retired" };
}

export function rollingUpdateReducer(
  state: RollingUpdateState,
  action: RollingUpdateAction,
): RollingUpdateState {
  switch (action.type) {
    case "start":
      return state.playback === "completed" ? state : { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialRollingUpdateState;
    case "set-replicas": {
      if (state.playback !== "idle") return state;
      const replicas = clampReplicas(action.replicas);
      return { ...state, replicas, oldReady: replicas };
    }
    case "tick":
      return advance(state);
  }
}

export const PRIVATE_PATH_PHASES = [
  "ready",
  "resolving",
  "connecting",
  "transferring",
  "delivered",
] as const;

export type PrivatePathPhase = (typeof PRIVATE_PATH_PHASES)[number];

export interface PrivatePathState {
  phase: PrivatePathPhase;
  cycle: number;
}

export type PrivatePathAction = { type: "advance" } | { type: "reset" };

export const initialPrivatePathState: PrivatePathState = {
  phase: "ready",
  cycle: 1,
};

export function privatePathReducer(
  state: PrivatePathState,
  action: PrivatePathAction,
): PrivatePathState {
  if (action.type === "reset") return initialPrivatePathState;

  const phaseIndex = PRIVATE_PATH_PHASES.indexOf(state.phase);
  const nextPhase = PRIVATE_PATH_PHASES[phaseIndex + 1];
  return nextPhase
    ? { ...state, phase: nextPhase }
    : { phase: PRIVATE_PATH_PHASES[0], cycle: state.cycle + 1 };
}

export function hasReachedPhase(
  current: PrivatePathPhase,
  target: PrivatePathPhase,
): boolean {
  return PRIVATE_PATH_PHASES.indexOf(current) >= PRIVATE_PATH_PHASES.indexOf(target);
}

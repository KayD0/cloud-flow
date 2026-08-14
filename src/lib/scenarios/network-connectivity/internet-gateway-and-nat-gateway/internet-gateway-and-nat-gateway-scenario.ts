export const SCENE_TICKS = 12;

export type GatewayScenePhase = "public-ingress" | "route-handoff" | "private-egress" | "cycle-reset";

export interface GatewaySceneState {
  tick: number;
  cycle: number;
  phase: GatewayScenePhase;
}

export const initialGatewaySceneState: GatewaySceneState = {
  tick: 0,
  cycle: 0,
  phase: "public-ingress",
};

export function phaseForTick(tick: number): GatewayScenePhase {
  if (tick < 5) return "public-ingress";
  if (tick === 5) return "route-handoff";
  if (tick < 11) return "private-egress";
  return "cycle-reset";
}

export function advanceGatewayScene(state: GatewaySceneState): GatewaySceneState {
  const nextTick = (state.tick + 1) % SCENE_TICKS;
  return {
    tick: nextTick,
    cycle: state.cycle + Number(nextTick === 0),
    phase: phaseForTick(nextTick),
  };
}

export function gatewaySceneReducer(
  state: GatewaySceneState,
  action: { type: "tick" },
): GatewaySceneState {
  return action.type === "tick" ? advanceGatewayScene(state) : state;
}

export function ingressProgress(tick: number): number {
  return Math.min(tick / 4, 1);
}

export function egressProgress(tick: number): number {
  return Math.min(Math.max((tick - 6) / 4, 0), 1);
}

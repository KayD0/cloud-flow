import type { ScenarioControls } from "@/lib/infrastructure/model";

export type PeeringStatus = "disconnected" | "connected";
export type TrafficDirection = "a-to-b" | "b-to-a";
export type ReachabilityResult = "pending" | "reachable" | "blocked";

export interface VpcVnetPeeringState extends ScenarioControls {
  peering: PeeringStatus;
  direction: TrafficDirection;
  progress: number;
  result: ReachabilityResult;
}

export type VpcVnetPeeringAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "connect" }
  | { type: "disconnect" }
  | { type: "set-direction"; direction: TrafficDirection }
  | { type: "tick" };

export const initialVpcVnetPeeringState: VpcVnetPeeringState = {
  playback: "idle",
  speed: 1,
  traffic: 1,
  peering: "disconnected",
  direction: "a-to-b",
  progress: 0,
  result: "pending",
};

function prepare(state: VpcVnetPeeringState): VpcVnetPeeringState {
  return { ...state, playback: "idle", progress: 0, result: "pending" };
}

function tick(state: VpcVnetPeeringState): VpcVnetPeeringState {
  if (state.playback !== "running") return state;

  const boundary = 0.5;
  const nextProgress = Math.min(1, state.progress + 0.1);

  if (state.peering === "disconnected" && nextProgress >= boundary) {
    return { ...state, playback: "paused", progress: boundary, result: "blocked" };
  }

  if (nextProgress >= 1) {
    return { ...state, playback: "paused", progress: 1, result: "reachable" };
  }

  return { ...state, progress: nextProgress };
}

export function vpcVnetPeeringReducer(
  state: VpcVnetPeeringState,
  action: VpcVnetPeeringAction,
): VpcVnetPeeringState {
  switch (action.type) {
    case "start":
      return {
        ...state,
        playback: "running",
        progress: state.result === "pending" ? state.progress : 0,
        result: "pending",
      };
    case "pause":
      return { ...state, playback: "paused" };
    case "reset":
      return initialVpcVnetPeeringState;
    case "connect":
      return prepare({ ...state, peering: "connected" });
    case "disconnect":
      return prepare({ ...state, peering: "disconnected" });
    case "set-direction":
      return prepare({ ...state, direction: action.direction });
    case "tick":
      return tick(state);
  }
}

export function describeVpcVnetPeeringState(state: VpcVnetPeeringState): string {
  const route = state.direction === "a-to-b" ? "A から B" : "B から A";
  if (state.result === "reachable") return `${route} へ到達しました。Peering が接続済みのため通信できます。`;
  if (state.result === "blocked") return `${route} の通信は Peering 境界で遮断されました。接続が確立されていません。`;
  if (state.playback === "running") return `${route} へ到達可能性を確認しています。`;
  if (state.playback === "paused" && state.progress > 0) return `${route} への確認を一時停止しています。`;
  return `${route} への通信を開始できます。現在の Peering は${state.peering === "connected" ? "接続済み" : "切断中"}です。`;
}

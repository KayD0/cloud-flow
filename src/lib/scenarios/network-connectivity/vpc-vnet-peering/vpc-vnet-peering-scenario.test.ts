import { describe, expect, it } from "vitest";
import {
  describeVpcVnetPeeringState,
  initialVpcVnetPeeringState,
  vpcVnetPeeringReducer,
  type VpcVnetPeeringState,
} from "./vpc-vnet-peering-scenario";

function runToCompletion(state: VpcVnetPeeringState) {
  let current = vpcVnetPeeringReducer(state, { type: "start" });
  for (let count = 0; count < 12; count += 1) current = vpcVnetPeeringReducer(current, { type: "tick" });
  return current;
}

describe("vpcVnetPeeringReducer", () => {
  it("接続済みならVPC / VNet Bへ到達する", () => {
    const connected = vpcVnetPeeringReducer(initialVpcVnetPeeringState, { type: "connect" });
    expect(runToCompletion(connected)).toMatchObject({ progress: 1, result: "reachable", playback: "paused" });
  });

  it("切断中ならPeering境界で通信を遮断する", () => {
    expect(runToCompletion(initialVpcVnetPeeringState)).toMatchObject({ progress: 0.5, result: "blocked", playback: "paused" });
  });

  it("通信方向をBからAへ変更できる", () => {
    const state = vpcVnetPeeringReducer(initialVpcVnetPeeringState, { type: "set-direction", direction: "b-to-a" });
    expect(state.direction).toBe("b-to-a");
    expect(describeVpcVnetPeeringState(state)).toContain("B から A");
  });

  it("接続状態を変えると進行中の確認結果を初期化する", () => {
    const running = vpcVnetPeeringReducer({ ...initialVpcVnetPeeringState, progress: 0.3, playback: "running" }, { type: "connect" });
    expect(running).toMatchObject({ peering: "connected", progress: 0, result: "pending", playback: "idle" });
  });

  it("Pause中のtickでは状態を変更しない", () => {
    const paused = { ...initialVpcVnetPeeringState, playback: "paused" as const, progress: 0.2 };
    expect(vpcVnetPeeringReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Resetで合成した初期状態へ戻す", () => {
    const changed = { ...initialVpcVnetPeeringState, peering: "connected" as const, direction: "b-to-a" as const, result: "reachable" as const, progress: 1 };
    expect(vpcVnetPeeringReducer(changed, { type: "reset" })).toEqual(initialVpcVnetPeeringState);
  });
});

import { describe, expect, it } from "vitest";
import {
  calculatePeeringScore,
  describeVpcVnetPeeringState,
  getGuidedStep,
  initialVpcVnetPeeringState,
  vpcVnetPeeringReducer,
  type VpcVnetPeeringAction,
  type VpcVnetPeeringState,
} from "./vpc-vnet-peering-scenario";

function reduce(actions: VpcVnetPeeringAction[], initial = initialVpcVnetPeeringState) {
  return actions.reduce<VpcVnetPeeringState>(vpcVnetPeeringReducer, initial);
}

describe("vpcVnetPeeringReducer", () => {
  it("非重複 Peer と双方向 Route で勝利する", () => {
    const state = reduce([
      { type: "start" },
      { type: "select-peer", peer: "network-b" },
      { type: "toggle-route", direction: "a-to-peer" },
      { type: "toggle-route", direction: "peer-to-a" },
      { type: "check" },
    ]);
    expect(state).toMatchObject({ phase: "won", failureReason: null, checks: 1 });
    expect(describeVpcVnetPeeringState(state)).toContain("双方向通信");
  });

  it("重複 CIDR の Peer は失敗する", () => {
    const state = reduce([
      { type: "start" },
      { type: "select-peer", peer: "network-c" },
      { type: "toggle-route", direction: "a-to-peer" },
      { type: "toggle-route", direction: "peer-to-a" },
      { type: "check" },
    ]);
    expect(state).toMatchObject({ phase: "failed", failureReason: "cidr-overlap" });
    expect(describeVpcVnetPeeringState(state)).toContain("重複");
  });

  it.each([
    [true, false],
    [false, true],
    [false, false],
  ])("Route が片方向以下なら失敗する (%s, %s)", (routeAToPeer, routePeerToA) => {
    let state = reduce([{ type: "start" }, { type: "select-peer", peer: "network-b" }]);
    if (routeAToPeer) state = vpcVnetPeeringReducer(state, { type: "toggle-route", direction: "a-to-peer" });
    if (routePeerToA) state = vpcVnetPeeringReducer(state, { type: "toggle-route", direction: "peer-to-a" });
    expect(vpcVnetPeeringReducer(state, { type: "check" }).failureReason).toBe("one-way-route");
  });

  it("Peer 未選択を境界ケースとして扱う", () => {
    const state = reduce([{ type: "start" }, { type: "check" }]);
    expect(state.failureReason).toBe("missing-peer");
  });

  it("Challenge を明示された3軸で採点する", () => {
    expect(calculatePeeringScore("network-b", true, true, 1)).toEqual({
      accuracy: 40,
      safety: 30,
      completeness: 30,
      total: 100,
    });
    expect(calculatePeeringScore("network-c", true, true, 2).total).toBe(25);
  });

  it("Pause 中の操作を無視し、Reset はモードを保って固定初期状態へ戻す", () => {
    const paused = reduce([{ type: "set-mode", mode: "challenge" }, { type: "start" }, { type: "pause" }]);
    expect(vpcVnetPeeringReducer(paused, { type: "select-peer", peer: "network-b" })).toBe(paused);
    expect(vpcVnetPeeringReducer(paused, { type: "reset" })).toEqual({
      ...initialVpcVnetPeeringState,
      mode: "challenge",
    });
  });

  it("Guided の次の判断理由を段階表示する", () => {
    const playing = reduce([{ type: "start" }]);
    expect(getGuidedStep(playing)).toContain("手順 1/3");
    const selected = vpcVnetPeeringReducer(playing, { type: "select-peer", peer: "network-b" });
    expect(getGuidedStep(selected)).toContain("手順 2/3");
  });
});

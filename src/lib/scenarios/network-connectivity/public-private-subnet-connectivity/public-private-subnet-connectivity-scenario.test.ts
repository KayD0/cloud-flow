import { describe, expect, it } from "vitest";
import { evaluateConnectivity, initialPublicPrivateSubnetState, publicPrivateSubnetReducer, type PublicPrivateSubnetState } from "./public-private-subnet-connectivity-scenario";

function runToOutcome(state: PublicPrivateSubnetState) {
  let current = publicPrivateSubnetReducer(state, { type: "start" });
  for (let count = 0; count < 3; count += 1) current = publicPrivateSubnetReducer(current, { type: "tick" });
  return current;
}

describe("publicPrivateSubnetReducer", () => {
  it("Gateway が有効なら Internet から Public Resource へ到達する", () => {
    const state = runToOutcome(initialPublicPrivateSubnetState);
    expect(state.playback).toBe("completed");
    expect(state.outcome).toBe("reachable");
  });

  it("Internet から Private Resource への直接接続は Gateway が有効でも遮断する", () => {
    const state = runToOutcome({ ...initialPublicPrivateSubnetState, target: "private" });
    expect(state.playback).toBe("blocked");
    expect(state.explanation).toContain("公開経路がありません");
  });

  it("Gateway が無効なら Internet から Public Resource への接続を遮断する", () => {
    expect(evaluateConnectivity("internet", "public", false).reachable).toBe(false);
  });

  it("Internal Client は Gateway に依存せず両 Subnet へ到達する", () => {
    expect(evaluateConnectivity("internal", "public", false).reachable).toBe(true);
    expect(evaluateConnectivity("internal", "private", false).reachable).toBe(true);
  });

  it("Pause 中の tick は状態を変更しない", () => {
    const paused = { ...initialPublicPrivateSubnetState, playback: "paused" as const, step: 1 };
    expect(publicPrivateSubnetReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Reset で合成した初期状態へ戻る", () => {
    const changed = runToOutcome({ ...initialPublicPrivateSubnetState, source: "internal", target: "private" });
    expect(publicPrivateSubnetReducer(changed, { type: "reset" })).toEqual(initialPublicPrivateSubnetState);
  });
});

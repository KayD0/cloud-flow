import { describe, expect, it } from "vitest";
import { getStateExplanation, initialPrivateEndpointState, privateEndpointReducer, type PrivateEndpointState } from "./private-link-private-endpoint-scenario";

function complete(state: PrivateEndpointState) {
  let next = privateEndpointReducer(state, { type: "start" });
  next = privateEndpointReducer(next, { type: "tick" });
  next = privateEndpointReducer(next, { type: "tick" });
  return privateEndpointReducer(next, { type: "tick" });
}

describe("privateEndpointReducer", () => {
  it("Private Endpoint が有効なら private 経路で完了する", () => {
    const state = complete(initialPrivateEndpointState);
    expect(state).toMatchObject({ playback: "completed", step: 3, outcome: "private" });
    expect(getStateExplanation(state)).toContain("Public Internet を通らず");
  });

  it("Endpoint が無効でも比較用 Public 経路が有効なら public 経路で完了する", () => {
    const disabled = privateEndpointReducer(initialPrivateEndpointState, { type: "set-endpoint", enabled: false });
    const comparable = privateEndpointReducer(disabled, { type: "set-public-comparison", enabled: true });
    expect(complete(comparable).outcome).toBe("public");
  });

  it("利用可能な経路がなければ通信を遮断する", () => {
    const disabled = privateEndpointReducer(initialPrivateEndpointState, { type: "set-endpoint", enabled: false });
    expect(complete(disabled).outcome).toBe("blocked");
  });

  it("Pause 中の tick では状態を変更しない", () => {
    const paused = privateEndpointReducer(privateEndpointReducer(initialPrivateEndpointState, { type: "start" }), { type: "pause" });
    expect(privateEndpointReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Reset で合成した初期状態へ戻る", () => {
    const changed = complete({ ...initialPrivateEndpointState, endpointEnabled: false, comparePublicRoute: true });
    expect(privateEndpointReducer(changed, { type: "reset" })).toEqual(initialPrivateEndpointState);
  });
});

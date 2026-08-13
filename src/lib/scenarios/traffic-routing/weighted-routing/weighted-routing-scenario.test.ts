import { describe, expect, it } from "vitest";
import {
  initialWeightedRoutingState,
  weightedRoutingReducer,
  type WeightedRoutingState,
} from "./weighted-routing-scenario";

function runToCompletion(state: WeightedRoutingState) {
  let current = weightedRoutingReducer(state, { type: "start" });
  for (let tick = 0; tick < 500 && current.playback !== "completed"; tick += 1) {
    current = weightedRoutingReducer(current, { type: "tick" });
  }
  return current;
}

describe("weightedRoutingReducer", () => {
  it("重み80:20で20件をStable 16件、Canary 4件へ配送する", () => {
    const state = runToCompletion({ ...initialWeightedRoutingState, weights: { stable: 80, canary: 20 } });
    expect(state.playback).toBe("completed");
    expect(state.completed).toEqual({ stable: 16, canary: 4 });
  });

  it("Canaryの重みが0なら全件をStableへ配送する", () => {
    const state = runToCompletion({ ...initialWeightedRoutingState, weights: { stable: 100, canary: 0 }, requestCount: 7 });
    expect(state.completed).toEqual({ stable: 7, canary: 0 });
  });

  it("両方の重みが0なら開始しない", () => {
    const state = { ...initialWeightedRoutingState, weights: { stable: 0, canary: 0 } };
    expect(weightedRoutingReducer(state, { type: "start" })).toBe(state);
  });

  it("実行中に両方の重みが0になると配送を一時停止する", () => {
    const running = { ...initialWeightedRoutingState, playback: "running" as const, weights: { stable: 10, canary: 0 } };
    const state = weightedRoutingReducer(running, { type: "set-weight", destination: "stable", weight: 0 });
    expect(state.playback).toBe("paused");
    expect(state.weights).toEqual({ stable: 0, canary: 0 });
  });

  it("Pause中のtickでは状態を変更しない", () => {
    const paused = { ...initialWeightedRoutingState, playback: "paused" as const };
    expect(weightedRoutingReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Resetで重み、Request数、進捗を合成した初期状態へ戻す", () => {
    const changed = runToCompletion({ ...initialWeightedRoutingState, weights: { stable: 50, canary: 50 }, requestCount: 4 });
    expect(weightedRoutingReducer(changed, { type: "reset" })).toEqual(initialWeightedRoutingState);
  });
});

import { describe, expect, it } from "vitest";
import { ALLOCATION_TOLERANCE, evaluateRoute, initialWeightedRoutingState, weightedRoutingReducer } from "./weighted-routing-scenario";

describe("カナリア・コントロール", () => {
  it("目標配分と安全条件を同時に満たすと勝利する", () => {
    const result = evaluateRoute(20);
    expect(result.outcome).toBe("won");
    expect(result.delivered).toEqual({ stable: 16, canary: 4, failed: 0 });
    expect(result.score.total).toBe(100);
  });

  it("Canary 配分が大きすぎると障害率上限を超えて失敗する", () => {
    const result = evaluateRoute(50);
    expect(result.outcome).toBe("failed");
    expect(result.canaryFailureRate).toBeGreaterThan(15);
    expect(result.reason).toContain("安全上限");
  });

  it("配分誤差が大きすぎると安全でも失敗する", () => {
    const result = evaluateRoute(0);
    expect(result.outcome).toBe("failed");
    expect(result.canaryFailureRate).toBeLessThanOrEqual(15);
    expect(result.allocationError).toBeGreaterThan(ALLOCATION_TOLERANCE);
  });

  it("許容境界の25%は勝利し、26%は失敗する", () => {
    expect(evaluateRoute(25).outcome).toBe("won");
    expect(evaluateRoute(26).outcome).toBe("failed");
  });

  it("Pause 中は進まず、再開後に固定件数で結果を確定する", () => {
    let state = weightedRoutingReducer(initialWeightedRoutingState, { type: "start" });
    state = weightedRoutingReducer(state, { type: "tick" });
    state = weightedRoutingReducer(state, { type: "pause" });
    expect(weightedRoutingReducer(state, { type: "tick" })).toBe(state);
    state = weightedRoutingReducer(state, { type: "start" });
    for (let i = 0; i < 20; i += 1) state = weightedRoutingReducer(state, { type: "tick" });
    expect(state.phase).toBe("failed");
    expect(state.result).not.toBeNull();
  });

  it("Reset でモードを含む同じ合成初期状態へ戻る", () => {
    const changed = { ...initialWeightedRoutingState, mode: "challenge" as const, canaryWeight: 80, dispatched: 12 };
    expect(weightedRoutingReducer(changed, { type: "reset" })).toEqual(initialWeightedRoutingState);
  });
});

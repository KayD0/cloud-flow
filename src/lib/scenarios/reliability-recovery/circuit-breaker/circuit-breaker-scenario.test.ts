import { describe, expect, it } from "vitest";
import { circuitBreakerReducer, initialCircuitBreakerState, type CircuitBreakerState } from "./circuit-breaker-scenario";
const tick = (state: CircuitBreakerState, count = 1) => { let current = state; for (let index = 0; index < count; index += 1) current = circuitBreakerReducer(current, { type: "tick" }); return current; };
const running = (patch: Partial<CircuitBreakerState> = {}): CircuitBreakerState => ({ ...initialCircuitBreakerState, playback: "running", ...patch });
describe("circuitBreakerReducer", () => {
  it("閾値まで失敗すると Closed から Open へ遷移する", () => { const before = tick(running({ injectFailure: true }), 2); expect(before.circuit).toBe("closed"); const opened = tick(before); expect(opened.circuit).toBe("open"); expect(opened.lastTransition).toBe("Closed → Open"); });
  it("Open では要求を遮断し、待機後に Half-open へ遷移する", () => { const halfOpen = tick(tick(running({ injectFailure: true }), 3), 3); expect(halfOpen.circuit).toBe("half-open"); expect(halfOpen.blockedRequests).toBe(3); expect(halfOpen.lastTransition).toBe("Open → Half-open"); });
  it("必要な回復試行が成功すると Closed へ戻る", () => { const recovered = tick(running({ circuit: "half-open", recoveryTrials: 2 }), 2); expect(recovered.circuit).toBe("closed"); expect(recovered.completedRecoveries).toBe(1); });
  it("Half-open の試行失敗では Open へ戻る", () => { const reopened = tick(running({ circuit: "half-open", injectFailure: true })); expect(reopened.circuit).toBe("open"); expect(reopened.lastTransition).toBe("Half-open → Open"); });
  it("正常応答と設定値の境界を処理する", () => { const healthy = tick(running({ consecutiveFailures: 2 })); expect(healthy.consecutiveFailures).toBe(0); expect(circuitBreakerReducer(healthy, { type: "set-threshold", value: 9 }).failureThreshold).toBe(5); expect(circuitBreakerReducer(healthy, { type: "set-recovery-trials", value: 0 }).recoveryTrials).toBe(1); });
  it("Pause 中は進行せず Reset で初期状態へ戻る", () => { const changed = tick(running({ injectFailure: true })); const paused = circuitBreakerReducer(changed, { type: "pause" }); expect(circuitBreakerReducer(paused, { type: "tick" })).toBe(paused); expect(circuitBreakerReducer(paused, { type: "reset" })).toEqual(initialCircuitBreakerState); });
});

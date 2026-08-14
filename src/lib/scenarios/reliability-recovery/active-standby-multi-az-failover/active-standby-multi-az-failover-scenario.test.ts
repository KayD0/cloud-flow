import { describe, expect, it } from "vitest";
import { failoverScenarioReducer, initialFailoverScenarioState, type FailoverScenarioState } from "./active-standby-multi-az-failover-scenario";

function completePromotion(state: FailoverScenarioState) {
  let next = state;
  for (let step = 0; step < 4; step += 1) next = failoverScenarioReducer(next, { type: "tick" });
  return next;
}

describe("failoverScenarioReducer", () => {
  it("Active Healthy から Down、Standby Promoting、Recovered へ遷移する", () => {
    const down = failoverScenarioReducer(initialFailoverScenarioState, { type: "inject-failure" });
    const promoting = failoverScenarioReducer(down, { type: "begin-failover" });
    const promoted = completePromotion(promoting);
    const recovered = failoverScenarioReducer(promoted, { type: "confirm-recovery" });
    expect(down.phase).toBe("down"); expect(promoting.phase).toBe("standby-promoting"); expect(promoted.promotionProgress).toBe(100);
    expect(recovered).toMatchObject({ phase: "recovered", routedAz: "az-b", outcome: "recovery-confirmed" });
  });
  it("障害判定前の Failover 開始を拒否する", () => {
    const state = failoverScenarioReducer(initialFailoverScenarioState, { type: "begin-failover" });
    expect(state.phase).toBe("active-healthy"); expect(state.outcome).toBe("action-rejected");
  });
  it("Standby の昇格完了前の復旧確認を拒否する", () => {
    const down = failoverScenarioReducer(initialFailoverScenarioState, { type: "inject-failure" });
    const promoting = failoverScenarioReducer(down, { type: "begin-failover" });
    const state = failoverScenarioReducer(promoting, { type: "confirm-recovery" });
    expect(state.phase).toBe("standby-promoting"); expect(state.routedAz).toBe("none"); expect(state.outcome).toBe("action-rejected");
  });
  it("Pause 中は昇格進捗を変更せず、Start 後に再開する", () => {
    const down = failoverScenarioReducer(initialFailoverScenarioState, { type: "inject-failure" });
    const promoting = failoverScenarioReducer(down, { type: "begin-failover" });
    const progressed = failoverScenarioReducer(promoting, { type: "tick" });
    const paused = failoverScenarioReducer(progressed, { type: "pause" });
    expect(failoverScenarioReducer(paused, { type: "tick" })).toBe(paused);
    const resumed = failoverScenarioReducer(paused, { type: "start" });
    expect(failoverScenarioReducer(resumed, { type: "tick" }).promotionProgress).toBe(50);
  });
  it("Reset で合成した初期状態へ戻る", () => {
    const changed = failoverScenarioReducer(initialFailoverScenarioState, { type: "inject-failure" });
    expect(failoverScenarioReducer(changed, { type: "reset" })).toEqual(initialFailoverScenarioState);
  });
});

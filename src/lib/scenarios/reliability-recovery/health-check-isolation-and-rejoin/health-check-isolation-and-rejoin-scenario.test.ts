import { describe, expect, it } from "vitest";
import { HEALTH_STAGES, healthCheckReducer, initialHealthCheckState, type HealthCheckState } from "./health-check-isolation-and-rejoin-scenario";

function tick(state: HealthCheckState, count = 1) {
  let next = state;
  for (let index = 0; index < count; index += 1) next = healthCheckReducer(next, { type: "tick" });
  return next;
}

describe("healthCheckReducer", () => {
  it("主要状態を順に通り、回復確認後に Healthy へ再参加する", () => {
    let state = healthCheckReducer(initialHealthCheckState, { type: "start" });
    const visited = [state.stage];
    for (let index = 0; index < 4; index += 1) {
      state = tick(state);
      if (visited.at(-1) !== state.stage) visited.push(state.stage);
    }
    expect(state.stage).toBe("isolated");
    state = healthCheckReducer(state, { type: "recover" });
    state = tick(state); visited.push(state.stage);
    state = tick(state); visited.push(state.stage);
    expect(visited).toEqual(HEALTH_STAGES);
    expect(state.playback).toBe("completed");
  });

  it("失敗を注入しない正常系は Healthy のまま完了する", () => {
    const configured = healthCheckReducer(initialHealthCheckState, { type: "set-failure", enabled: false });
    const state = tick(healthCheckReducer(configured, { type: "start" }));
    expect(state.stage).toBe("healthy");
    expect(state.playback).toBe("completed");
  });

  it("判定回数の直前では Warning のまま隔離しない", () => {
    const configured = healthCheckReducer(initialHealthCheckState, { type: "set-threshold", threshold: 4 });
    const state = tick(healthCheckReducer(configured, { type: "start" }), 3);
    expect(state.stage).toBe("warning");
    expect(state.failedChecks).toBe(3);
  });

  it("Isolated では回復操作まで待機し、Pause 中の tick は進まない", () => {
    const isolated = tick(healthCheckReducer(initialHealthCheckState, { type: "start" }), 4);
    const waiting = tick(isolated);
    expect(waiting.playback).toBe("paused");
    expect(tick(waiting)).toBe(waiting);
  });

  it("Reset で設定と進行を合成初期状態へ戻す", () => {
    const changed = tick(healthCheckReducer(initialHealthCheckState, { type: "start" }), 2);
    expect(healthCheckReducer(changed, { type: "reset" })).toEqual(initialHealthCheckState);
  });
});

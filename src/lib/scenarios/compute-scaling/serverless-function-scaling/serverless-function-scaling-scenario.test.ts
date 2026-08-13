import { describe, expect, it } from "vitest";
import { getScalingSnapshot, initialServerlessScalingState, serverlessScalingReducer, type ServerlessScalingState } from "./serverless-function-scaling-scenario";

function tick(state: ServerlessScalingState, count: number) {
  let next = state;
  for (let index = 0; index < count; index += 1) next = serverlessScalingReducer(next, { type: "tick" });
  return next;
}

describe("serverlessScalingReducer", () => {
  it("Invocation から Cold / Warm、Processing、Idle へ遷移する", () => {
    let state = serverlessScalingReducer(initialServerlessScalingState, { type: "start" });
    state = tick(state, 1); expect(state.phase).toBe("invocation");
    state = tick(state, 1); expect(state.phase).toBe("function");
    expect(getScalingSnapshot(state)).toMatchObject({ warmCount: 1, coldCount: 5 });
    state = tick(state, 1); expect(state.phase).toBe("processing");
    state = tick(state, 1); expect(state).toMatchObject({ phase: "idle", completedCount: 6 });
  });

  it("同時実行上限を超えた Invocation を待機させ、複数の波で完了する", () => {
    let state = serverlessScalingReducer(initialServerlessScalingState, { type: "set-invocations", count: 7 });
    state = serverlessScalingReducer(state, { type: "set-concurrency", count: 2 });
    state = serverlessScalingReducer(state, { type: "start" });
    state = tick(state, 2);
    expect(getScalingSnapshot(state)).toMatchObject({ activeCount: 2, queuedCount: 5, isConstrained: true });
    state = tick(state, 18);
    expect(state).toMatchObject({ playback: "completed", completedCount: 7, phase: "idle" });
  });

  it("2回目以降は Idle の Function を Warm として再利用する", () => {
    let state = serverlessScalingReducer(initialServerlessScalingState, { type: "set-invocations", count: 8 });
    state = serverlessScalingReducer(state, { type: "start" });
    state = tick(state, 6);
    expect(state).toMatchObject({ phase: "function", batch: 1 });
    expect(getScalingSnapshot(state)).toMatchObject({ coldCount: 0, warmCount: 2 });
  });

  it("Pause 中の tick は状態を変更しない", () => {
    const running = serverlessScalingReducer(initialServerlessScalingState, { type: "start" });
    const paused = serverlessScalingReducer(running, { type: "pause" });
    expect(serverlessScalingReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Reset で合成した初期状態へ戻る", () => {
    let state = serverlessScalingReducer(initialServerlessScalingState, { type: "set-invocations", count: 18 });
    state = serverlessScalingReducer(state, { type: "start" });
    state = tick(state, 3);
    expect(serverlessScalingReducer(state, { type: "reset" })).toEqual(initialServerlessScalingState);
  });
});

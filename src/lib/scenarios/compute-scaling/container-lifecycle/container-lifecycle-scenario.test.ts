import { describe, expect, it } from "vitest";
import { containerLifecycleReducer, initialContainerLifecycleState, type ContainerLifecycleAction, type ContainerLifecycleState } from "./container-lifecycle-scenario";
function reduce(state: ContainerLifecycleState, actions: ContainerLifecycleAction[]) { return actions.reduce(containerLifecycleReducer, state); }
describe("containerLifecycleReducer", () => {
  it("Created から Starting、Ready、Processing を経て Ready に戻る", () => {
    const state = reduce(initialContainerLifecycleState, [{ type: "play" }, { type: "start-container" }, { type: "tick" }, { type: "submit-job" }, { type: "tick" }]);
    expect(state).toMatchObject({ stage: "ready", playback: "running", completedJobs: 1, rejectedJobs: 0 });
  });
  it("停止と再起動では Stopped、Restarting、Starting、Ready の順に進む", () => {
    const state = reduce(initialContainerLifecycleState, [{ type: "play" }, { type: "start-container" }, { type: "tick" }, { type: "stop-container" }, { type: "restart-container" }, { type: "tick" }, { type: "tick" }]);
    expect(state.stage).toBe("ready");
  });
  it("Ready 前の処理投入を拒否して境界ケースを記録する", () => {
    const state = containerLifecycleReducer(initialContainerLifecycleState, { type: "submit-job" });
    expect(state).toMatchObject({ stage: "created", rejectedJobs: 1 });
    expect(state.message).toContain("Ready");
  });
  it("Pause 中は時間経過による状態遷移を止める", () => {
    const paused = reduce(initialContainerLifecycleState, [{ type: "play" }, { type: "start-container" }, { type: "pause" }]);
    expect(containerLifecycleReducer(paused, { type: "tick" })).toBe(paused);
  });
  it("Reset で合成した初期状態へ戻る", () => {
    const changed = reduce(initialContainerLifecycleState, [{ type: "play" }, { type: "start-container" }, { type: "tick" }, { type: "submit-job" }]);
    expect(containerLifecycleReducer(changed, { type: "reset" })).toEqual(initialContainerLifecycleState);
  });
});

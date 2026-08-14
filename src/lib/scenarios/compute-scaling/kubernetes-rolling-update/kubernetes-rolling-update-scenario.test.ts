import { describe, expect, it } from "vitest";
import { initialRollingUpdateState, rollingUpdateReducer, type RollingUpdateState } from "./kubernetes-rolling-update-scenario";

function runToCompletion(state: RollingUpdateState) {
  let current = rollingUpdateReducer(state, { type: "start" });
  for (let tick = 0; tick < 100 && current.playback !== "completed"; tick += 1) current = rollingUpdateReducer(current, { type: "tick" });
  return current;
}

describe("rollingUpdateReducer", () => {
  it("Current ReplicaSetから全Podを置換しOld retiredで完了する", () => {
    expect(runToCompletion(initialRollingUpdateState)).toMatchObject({ playback: "completed", stage: "old-retired", oldReady: 0, newReady: 4, oldRetired: 4 });
  });

  it("新PodがReadyになるまで旧Podをdrainしない", () => {
    const running = rollingUpdateReducer(initialRollingUpdateState, { type: "start" });
    const afterNewPod = rollingUpdateReducer(running, { type: "tick" });
    expect(afterNewPod).toMatchObject({ stage: "new-replica-set", oldReady: 4, newReady: 1 });
    expect(rollingUpdateReducer(afterNewPod, { type: "tick" })).toMatchObject({ stage: "pod-replacement", oldReady: 3, oldRetired: 1 });
  });

  it("境界値Replica 1でもReady数を失わずに置換する", () => {
    const configured = rollingUpdateReducer(initialRollingUpdateState, { type: "set-replicas", replicas: 1 });
    const running = rollingUpdateReducer(configured, { type: "start" });
    const surged = rollingUpdateReducer(running, { type: "tick" });
    expect(surged.oldReady + surged.newReady).toBe(2);
    expect(rollingUpdateReducer(surged, { type: "tick" })).toMatchObject({ playback: "completed", oldReady: 0, newReady: 1 });
  });

  it("Pause中のtickでは状態を変更しない", () => {
    const running = rollingUpdateReducer(initialRollingUpdateState, { type: "start" });
    const paused = rollingUpdateReducer(running, { type: "pause" });
    expect(rollingUpdateReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("実行中はReplica数を変更しない", () => {
    const running = rollingUpdateReducer(initialRollingUpdateState, { type: "start" });
    expect(rollingUpdateReducer(running, { type: "set-replicas", replicas: 8 })).toBe(running);
  });

  it("Resetで合成した初期状態へ戻す", () => {
    const completed = runToCompletion({ ...initialRollingUpdateState, replicas: 2, oldReady: 2 });
    expect(rollingUpdateReducer(completed, { type: "reset" })).toEqual(initialRollingUpdateState);
  });
});

import { describe, expect, it } from "vitest";
import { getStateExplanation, initialPrimaryReplicaState, primaryReplicaReducer, type PrimaryReplicaState } from "./primary-and-read-replica-scenario";

function complete(state: PrimaryReplicaState) {
  let next = primaryReplicaReducer(state, { type: "start" });
  for (let index = 0; index < 4; index += 1) next = primaryReplicaReducer(next, { type: "tick" });
  return next;
}

describe("primaryReplicaReducer", () => {
  it("Write は Primary から Replica への複製で完了する", () => {
    expect(complete(initialPrimaryReplicaState)).toMatchObject({ playback: "completed", step: 4, outcome: "write-replicated" });
  });
  it("非同期複製の遅延中に Replica を読むと古い値になる", () => {
    const completed = complete(primaryReplicaReducer(initialPrimaryReplicaState, { type: "set-operation", operation: "read" }));
    expect(completed.outcome).toBe("read-stale");
    expect(getStateExplanation(completed)).toContain("古い合成値 v1");
  });
  it("同期複製なら Replica から最新値を読める", () => {
    let state = primaryReplicaReducer(initialPrimaryReplicaState, { type: "set-operation", operation: "read" });
    state = primaryReplicaReducer(state, { type: "set-replication-mode", mode: "sync" });
    expect(complete(state).outcome).toBe("read-fresh");
  });
  it("Read を Primary に分散した場合は遅延の影響を受けない", () => {
    let state = primaryReplicaReducer(initialPrimaryReplicaState, { type: "set-operation", operation: "read" });
    state = primaryReplicaReducer(state, { type: "set-read-target", target: "primary" });
    expect(complete(state).outcome).toBe("read-fresh");
  });
  it("Pause 中の tick は状態を変更せず、lag は範囲内に制限する", () => {
    const paused = primaryReplicaReducer(primaryReplicaReducer(initialPrimaryReplicaState, { type: "start" }), { type: "pause" });
    expect(primaryReplicaReducer(paused, { type: "tick" })).toBe(paused);
    expect(primaryReplicaReducer(paused, { type: "set-lag", lagMs: 3000 }).replicationLagMs).toBe(2000);
  });
  it("Reset で合成した初期状態へ戻る", () => {
    expect(primaryReplicaReducer(complete({ ...initialPrimaryReplicaState, operation: "read" }), { type: "reset" })).toEqual(initialPrimaryReplicaState);
  });
});

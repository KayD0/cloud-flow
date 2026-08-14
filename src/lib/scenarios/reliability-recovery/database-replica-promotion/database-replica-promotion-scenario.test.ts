import { describe, expect, it } from "vitest";
import { databaseReplicaPromotionReducer, describeDatabaseReplicaPromotionState, initialDatabaseReplicaPromotionState, type DatabaseReplicaPromotionState } from "./database-replica-promotion-scenario";

function dispatch(state: DatabaseReplicaPromotionState, type: "fail-primary" | "promote-replica" | "switch-connection") {
  return databaseReplicaPromotionReducer(state, { type });
}

describe("databaseReplicaPromotionReducer", () => {
  it("自動再生で障害から接続切り替え、復旧まで進む", () => {
    let state = databaseReplicaPromotionReducer(initialDatabaseReplicaPromotionState, { type: "start" });
    const phases = [];
    for (let index = 0; index < 4; index += 1) { state = databaseReplicaPromotionReducer(state, { type: "tick" }); phases.push(state.phase); }
    expect(phases).toEqual(["primary-down", "promoting", "connection-switch", "recovered"]);
    expect(state.playback).toBe("completed");
  });
  it("個別操作で正常な復旧手順を進められる", () => {
    let state = dispatch(initialDatabaseReplicaPromotionState, "fail-primary");
    state = dispatch(state, "promote-replica"); state = dispatch(state, "switch-connection"); state = dispatch(state, "switch-connection");
    expect(state).toMatchObject({ phase: "recovered", playback: "completed", notice: "none" });
  });
  it("障害確認前の昇格を拒否して理由を説明する", () => {
    const state = dispatch(initialDatabaseReplicaPromotionState, "promote-replica");
    expect(state).toMatchObject({ phase: "healthy", notice: "promotion-rejected" });
    expect(describeDatabaseReplicaPromotionState(state)).toContain("Primary の障害を確認する前");
  });
  it("昇格前の接続切り替えを拒否する", () => {
    expect(dispatch(dispatch(initialDatabaseReplicaPromotionState, "fail-primary"), "switch-connection")).toMatchObject({ phase: "primary-down", notice: "switch-rejected" });
  });
  it("Pause 中の tick は進まず Reset で合成初期状態に戻る", () => {
    const running = databaseReplicaPromotionReducer(initialDatabaseReplicaPromotionState, { type: "start" });
    const paused = databaseReplicaPromotionReducer(running, { type: "pause" });
    expect(databaseReplicaPromotionReducer(paused, { type: "tick" })).toBe(paused);
    expect(databaseReplicaPromotionReducer(dispatch(initialDatabaseReplicaPromotionState, "fail-primary"), { type: "reset" })).toEqual(initialDatabaseReplicaPromotionState);
  });
});

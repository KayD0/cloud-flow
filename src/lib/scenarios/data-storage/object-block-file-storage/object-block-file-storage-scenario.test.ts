import { describe, expect, it } from "vitest";
import { getStorageExplanation, initialStorageScenarioState, storageScenarioReducer, type StorageScenarioState } from "./object-block-file-storage-scenario";

function complete(state: StorageScenarioState) {
  let current = storageScenarioReducer(state, { type: "start" });
  for (let index = 0; index < 4; index += 1) current = storageScenarioReducer(current, { type: "tick" });
  return current;
}

describe("storageScenarioReducer", () => {
  it("Object Storage へ合成データを保存する", () => {
    const state = complete(initialStorageScenarioState);
    expect(state).toMatchObject({ playback: "completed", step: 3, outcome: "saved" });
    expect(getStorageExplanation(state)).toContain("object key");
  });
  it("VM が File Storage から合成データを取得する", () => {
    const state = complete({ ...initialStorageScenarioState, storageType: "file", actor: "vm", operation: "read" });
    expect(state.outcome).toBe("retrieved");
    expect(getStorageExplanation(state)).toContain("mounted share");
  });
  it("Application から Block Storage への直接アクセスを拒否する", () => {
    const state = complete({ ...initialStorageScenarioState, storageType: "block" });
    expect(state.outcome).toBe("blocked");
    expect(getStorageExplanation(state)).toContain("VM に volume を接続");
  });
  it("Pause 中の tick では状態を変更しない", () => {
    const paused = { ...initialStorageScenarioState, playback: "paused" as const, step: 1 as const };
    expect(storageScenarioReducer(paused, { type: "tick" })).toBe(paused);
  });
  it("設定変更で進行状況を初期化する", () => {
    const completed = complete(initialStorageScenarioState);
    expect(storageScenarioReducer(completed, { type: "set-actor", actor: "vm" })).toMatchObject({ actor: "vm", playback: "idle", step: 0, outcome: "waiting" });
  });
  it("Reset で合成した初期状態へ戻す", () => {
    const changed = complete({ ...initialStorageScenarioState, storageType: "file", actor: "vm" });
    expect(storageScenarioReducer(changed, { type: "reset" })).toEqual(initialStorageScenarioState);
  });
});

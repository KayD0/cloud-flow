import { describe, expect, it } from "vitest";
import { databaseReadWriteReducer, getStages, initialDatabaseReadWriteState, type DatabaseReadWriteAction, type DatabaseReadWriteState } from "./database-read-write-scenario";

function reduce(state: DatabaseReadWriteState, actions: DatabaseReadWriteAction[]) {
  return actions.reduce(databaseReadWriteReducer, state);
}

function finish(state: DatabaseReadWriteState) {
  return reduce(state, [{ type: "start" }, { type: "tick" }, { type: "tick" }, { type: "tick" }]);
}

describe("databaseReadWriteReducer", () => {
  it("Write は Application から Database へ進み、選択した合成データを保存する", () => {
    const completed = finish(initialDatabaseReadWriteState);
    expect(getStages("write").map((stage) => stage.id)).toEqual(["ready", "write-transit", "persisting", "write-complete"]);
    expect(completed.playback).toBe("completed");
    expect(completed.records.profile).toBe("Aoi / Standard");
  });

  it("Read は Database から Application へ保存済みの値を返す", () => {
    const read = reduce(initialDatabaseReadWriteState, [
      { type: "set-operation", operation: "read" },
      { type: "set-data-key", dataKey: "preference" },
    ]);
    const completed = finish(read);
    expect(getStages("read").map((stage) => stage.id)).toEqual(["ready", "read-request", "retrieving", "read-complete"]);
    expect(completed).toMatchObject({ playback: "completed", result: "Theme: Light" });
  });

  it("未登録キーの Read は not-found で完了し、データを変更しない", () => {
    const state = reduce(initialDatabaseReadWriteState, [
      { type: "set-operation", operation: "read" },
      { type: "set-data-key", dataKey: "missing" },
    ]);
    const completed = finish(state);
    expect(completed.playback).toBe("not-found");
    expect(completed.records).toEqual(initialDatabaseReadWriteState.records);
  });

  it("Pause 中の tick は進まず、Step は一段階だけ進む", () => {
    const paused = reduce(initialDatabaseReadWriteState, [{ type: "start" }, { type: "tick" }, { type: "pause" }]);
    expect(databaseReadWriteReducer(paused, { type: "tick" })).toBe(paused);
    expect(databaseReadWriteReducer(paused, { type: "step" })).toMatchObject({ stageIndex: 2, playback: "paused" });
  });

  it("Reset はデータを含むすべての状態を合成初期値へ戻す", () => {
    expect(databaseReadWriteReducer(finish(initialDatabaseReadWriteState), { type: "reset" })).toEqual(initialDatabaseReadWriteState);
  });
});

import { describe, expect, it } from "vitest";
import {
  backupRestoreReducer,
  getBackupRestoreExplanation,
  initialBackupRestoreState,
  type BackupRestoreState,
} from "./backup-restore-scenario";

function finish(state: BackupRestoreState): BackupRestoreState {
  let next = state;
  for (let count = 0; count < 3; count += 1) next = backupRestoreReducer(next, { type: "tick" });
  return next;
}

describe("backupRestoreReducer", () => {
  it("Backup 作成で新しい世代を Backup Store に追加する", () => {
    const completed = finish(backupRestoreReducer(initialBackupRestoreState, { type: "create-backup" }));
    expect(completed).toMatchObject({ phase: "completed", step: 3, selectedGenerationId: "gen-004" });
    expect(completed.generations[0]).toMatchObject({ id: "gen-004", recordCount: 1312, health: "available" });
  });

  it("選択した正常世代から Restore target を更新する", () => {
    const selected = backupRestoreReducer(initialBackupRestoreState, { type: "select-generation", id: "gen-001" });
    const completed = finish(backupRestoreReducer(selected, { type: "start-restore" }));
    expect(completed.phase).toBe("completed");
    expect(completed.restoreTarget).toContain("Generation 001");
    expect(completed.restoreTarget).toContain("1204 records");
  });

  it("破損世代の Restore は失敗し Restore target を変更しない", () => {
    const selected = backupRestoreReducer(initialBackupRestoreState, { type: "select-generation", id: "gen-002" });
    const failed = finish(backupRestoreReducer(selected, { type: "start-restore" }));
    expect(failed.phase).toBe("failed");
    expect(failed.restoreTarget).toBe("Unchanged · validation failed");
    expect(getBackupRestoreExplanation(failed)).toContain("破損");
  });

  it("Pause 中の tick では状態を進めない", () => {
    const running = backupRestoreReducer(initialBackupRestoreState, { type: "create-backup" });
    const paused = backupRestoreReducer(running, { type: "pause" });
    expect(backupRestoreReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Pause 後は同じ操作を現在の段階から再開する", () => {
    const running = backupRestoreReducer(initialBackupRestoreState, { type: "create-backup" });
    const progressed = backupRestoreReducer(running, { type: "tick" });
    const paused = backupRestoreReducer(progressed, { type: "pause" });
    expect(backupRestoreReducer(paused, { type: "create-backup" })).toMatchObject({ phase: "running", step: 1 });
  });

  it("Reset で合成した初期状態へ戻す", () => {
    const changed = finish(backupRestoreReducer(initialBackupRestoreState, { type: "create-backup" }));
    expect(backupRestoreReducer(changed, { type: "reset" })).toEqual(initialBackupRestoreState);
  });

  it("存在しない世代は選択しない", () => {
    expect(backupRestoreReducer(initialBackupRestoreState, { type: "select-generation", id: "missing" }))
      .toBe(initialBackupRestoreState);
  });
});

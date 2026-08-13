export type BackupRestorePhase = "idle" | "running" | "paused" | "completed" | "failed";
export type BackupRestoreOperation = "backup" | "restore";
export type GenerationHealth = "available" | "corrupt";

export interface BackupGeneration {
  id: string;
  label: string;
  recordCount: number;
  health: GenerationHealth;
}

export interface BackupRestoreState {
  phase: BackupRestorePhase;
  operation: BackupRestoreOperation;
  step: 0 | 1 | 2 | 3;
  generations: readonly BackupGeneration[];
  selectedGenerationId: string;
  restoreTarget: string;
}

export type BackupRestoreAction =
  | { type: "create-backup" }
  | { type: "start-restore" }
  | { type: "select-generation"; id: string }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" };

const initialGenerations: readonly BackupGeneration[] = [
  { id: "gen-003", label: "Generation 003 · 10:30", recordCount: 1280, health: "available" },
  { id: "gen-002", label: "Generation 002 · 09:30", recordCount: 1248, health: "corrupt" },
  { id: "gen-001", label: "Generation 001 · 08:30", recordCount: 1204, health: "available" },
];

export const initialBackupRestoreState: BackupRestoreState = {
  phase: "idle",
  operation: "backup",
  step: 0,
  generations: initialGenerations,
  selectedGenerationId: "gen-003",
  restoreTarget: "Empty · ready to receive",
};

export function getSelectedGeneration(state: BackupRestoreState): BackupGeneration {
  return state.generations.find((generation) => generation.id === state.selectedGenerationId) ?? state.generations[0];
}

function begin(state: BackupRestoreState, operation: BackupRestoreOperation): BackupRestoreState {
  const resume = state.phase === "paused" && state.operation === operation;
  return { ...state, operation, phase: "running", step: resume ? state.step : 0 };
}

export function backupRestoreReducer(state: BackupRestoreState, action: BackupRestoreAction): BackupRestoreState {
  switch (action.type) {
    case "create-backup":
      return begin(state, "backup");
    case "start-restore":
      return begin(state, "restore");
    case "select-generation":
      return state.generations.some((generation) => generation.id === action.id)
        ? { ...state, selectedGenerationId: action.id, phase: "idle", step: 0 }
        : state;
    case "pause":
      return state.phase === "running" ? { ...state, phase: "paused" } : state;
    case "reset":
      return initialBackupRestoreState;
    case "tick": {
      if (state.phase !== "running") return state;
      if (state.step < 2) return { ...state, step: (state.step + 1) as 1 | 2 };
      if (state.operation === "restore") {
        const generation = getSelectedGeneration(state);
        return generation.health === "corrupt"
          ? { ...state, step: 3, phase: "failed", restoreTarget: "Unchanged · validation failed" }
          : { ...state, step: 3, phase: "completed", restoreTarget: `${generation.label} · ${generation.recordCount} records` };
      }
      const generation: BackupGeneration = {
        id: "gen-004",
        label: "Generation 004 · now",
        recordCount: 1312,
        health: "available",
      };
      const generations = state.generations.some((item) => item.id === generation.id)
        ? state.generations
        : [generation, ...state.generations];
      return { ...state, step: 3, phase: "completed", generations, selectedGenerationId: generation.id };
    }
  }
}

export function getBackupRestoreExplanation(state: BackupRestoreState): string {
  if (state.phase === "failed") return "Restore 前の検証で選択世代の破損を検出しました。Restore target は変更されません。";
  if (state.phase === "completed" && state.operation === "backup") return "Primary Store の合成データを新しい世代として Backup Store に保存しました。";
  if (state.phase === "completed") return "検証済みの選択世代を Restore target に復元しました。世代により復元結果が変わります。";
  if (state.phase === "paused") return "一時停止中です。操作を再開すると現在の段階から処理を続けます。";
  if (state.phase === "running") {
    const backupSteps = ["Primary Store のスナップショットを開始しました。", "Backup generation を合成しています。", "Backup Store へ世代を書き込んでいます。"];
    const restoreSteps = ["選択した Backup generation を読み出しています。", "世代の整合性を検証しています。", "Restore target へデータを適用しています。"];
    return (state.operation === "backup" ? backupSteps : restoreSteps)[state.step];
  }
  return "初期状態です。Backup を作成するか、世代を選択して Restore を開始してください。";
}

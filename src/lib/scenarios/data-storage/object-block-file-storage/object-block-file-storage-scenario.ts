export const STORAGE_TYPES = ["object", "block", "file"] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];
export type StorageOperation = "read" | "write";
export type AccessActor = "application" | "vm";
export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type StorageOutcome = "waiting" | "saved" | "retrieved" | "blocked";

export interface StorageScenarioState {
  playback: PlaybackState;
  storageType: StorageType;
  operation: StorageOperation;
  actor: AccessActor;
  step: 0 | 1 | 2 | 3;
  outcome: StorageOutcome;
}

export type StorageScenarioAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" }
  | { type: "set-storage"; storageType: StorageType }
  | { type: "set-operation"; operation: StorageOperation }
  | { type: "set-actor"; actor: AccessActor };

export const initialStorageScenarioState: StorageScenarioState = {
  playback: "idle", storageType: "object", operation: "write", actor: "application", step: 0, outcome: "waiting",
};

function reconfigure(state: StorageScenarioState, change: Partial<StorageScenarioState>): StorageScenarioState {
  return { ...state, ...change, playback: "idle", step: 0, outcome: "waiting" };
}

export function isSupportedAccess(state: Pick<StorageScenarioState, "storageType" | "actor">) {
  return !(state.storageType === "block" && state.actor === "application");
}

export function storageScenarioReducer(state: StorageScenarioState, action: StorageScenarioAction): StorageScenarioState {
  switch (action.type) {
    case "start":
      return state.playback === "completed" ? { ...state, playback: "running", step: 0, outcome: "waiting" } : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialStorageScenarioState;
    case "set-storage": return reconfigure(state, { storageType: action.storageType });
    case "set-operation": return reconfigure(state, { operation: action.operation });
    case "set-actor": return reconfigure(state, { actor: action.actor });
    case "tick":
      if (state.playback !== "running") return state;
      if (state.step < 2) return { ...state, step: (state.step + 1) as 1 | 2 };
      return { ...state, playback: "completed", step: 3, outcome: isSupportedAccess(state) ? state.operation === "write" ? "saved" : "retrieved" : "blocked" };
  }
}

const storageDetails = {
  object: { unit: "object key", route: "HTTP-style API" },
  block: { unit: "fixed-size block", route: "attached volume" },
  file: { unit: "file / directory", route: "mounted share" },
} as const;

export function getStorageExplanation(state: StorageScenarioState): string {
  if (state.outcome === "blocked") return "Application は Block Storage を直接扱えません。VM に volume を接続し、OS のファイルシステムを経由する必要があります。";
  if (state.outcome === "saved" || state.outcome === "retrieved") {
    const detail = storageDetails[state.storageType];
    return `${detail.route} を通り、${detail.unit} 単位で合成データを${state.outcome === "saved" ? "保存" : "取得"}しました。`;
  }
  if (state.playback === "paused") return "一時停止中です。Start で現在の位置から再開できます。";
  if (state.step === 2) return "選択した Storage type のアクセス方式と主体の組み合わせを判定しています。";
  if (state.step === 1) return `${state.actor === "application" ? "Application" : "VM"} から合成リクエストを送信しています。`;
  return "初期状態です。保存方式、Read / Write、アクセス主体を選び、Start してください。";
}

export function getStorageDetail(storageType: StorageType) { return storageDetails[storageType]; }

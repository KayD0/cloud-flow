export const DATA_ITEMS = [
  { key: "profile", label: "Profile", value: "Aoi / Standard" },
  { key: "preference", label: "Preference", value: "Theme: Dark" },
  { key: "missing", label: "Missing key", value: null },
] as const;

export type Operation = "write" | "read";
export type DataKey = (typeof DATA_ITEMS)[number]["key"];
export type DelayMode = "normal" | "slow";
export type PlaybackState = "idle" | "running" | "paused" | "completed" | "not-found";

export interface DatabaseReadWriteState {
  operation: Operation;
  dataKey: DataKey;
  delayMode: DelayMode;
  playback: PlaybackState;
  stageIndex: number;
  records: Record<string, string>;
  result: string | null;
}

export type DatabaseReadWriteAction =
  | { type: "start" } | { type: "pause" } | { type: "tick" } | { type: "step" } | { type: "reset" }
  | { type: "set-operation"; operation: Operation }
  | { type: "set-data-key"; dataKey: DataKey }
  | { type: "set-delay"; delayMode: DelayMode };

export const delayMilliseconds: Record<DelayMode, number> = { normal: 800, slow: 1600 };

export const initialDatabaseReadWriteState: DatabaseReadWriteState = {
  operation: "write",
  dataKey: "profile",
  delayMode: "normal",
  playback: "idle",
  stageIndex: 0,
  records: { preference: "Theme: Light" },
  result: null,
};

export function getStages(operation: Operation) {
  return operation === "write"
    ? [
        { id: "ready", label: "Ready", detail: "Application に合成データが用意されています。" },
        { id: "write-transit", label: "Write → Database", detail: "Application から Database へ保存要求とデータを送ります。" },
        { id: "persisting", label: "Persisting", detail: "Database が指定されたキーへ合成データを保存します。" },
        { id: "write-complete", label: "Write complete", detail: "保存結果が Application に返り、Write が完了しました。" },
      ]
    : [
        { id: "ready", label: "Ready", detail: "Application が取得するデータ項目を指定しています。" },
        { id: "read-request", label: "Read ← Database", detail: "Application から Database へ取得要求を送ります。" },
        { id: "retrieving", label: "Retrieving", detail: "Database が指定されたキーを検索します。" },
        { id: "read-complete", label: "Read complete", detail: "Database から Application へ取得結果が返りました。" },
      ];
}

function selectedItem(state: DatabaseReadWriteState) {
  return DATA_ITEMS.find((item) => item.key === state.dataKey)!;
}

function advance(state: DatabaseReadWriteState, automatic: boolean): DatabaseReadWriteState {
  if (state.playback === "completed" || state.playback === "not-found") return state;
  const stages = getStages(state.operation);
  const stageIndex = Math.min(state.stageIndex + 1, stages.length - 1);
  if (stageIndex !== stages.length - 1) {
    return { ...state, stageIndex, playback: automatic ? "running" : "paused" };
  }
  if (state.operation === "write") {
    const item = selectedItem(state);
    if (item.value === null) return { ...state, stageIndex, playback: "not-found", result: "保存する値がありません" };
    return { ...state, stageIndex, playback: "completed", records: { ...state.records, [item.key]: item.value }, result: `${item.label} を保存しました` };
  }
  const value = state.records[state.dataKey];
  return value === undefined
    ? { ...state, stageIndex, playback: "not-found", result: "指定したキーは登録されていません" }
    : { ...state, stageIndex, playback: "completed", result: value };
}

export function databaseReadWriteReducer(state: DatabaseReadWriteState, action: DatabaseReadWriteAction): DatabaseReadWriteState {
  switch (action.type) {
    case "start": return state.playback === "completed" || state.playback === "not-found" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "tick": return state.playback === "running" ? advance(state, true) : state;
    case "step": return advance(state, false);
    case "reset": return initialDatabaseReadWriteState;
    case "set-operation": return state.playback === "idle" ? { ...state, operation: action.operation, stageIndex: 0, result: null } : state;
    case "set-data-key": return state.playback === "idle" ? { ...state, dataKey: action.dataKey, result: null } : state;
    case "set-delay": return state.playback === "idle" || state.playback === "paused" ? { ...state, delayMode: action.delayMode } : state;
  }
}

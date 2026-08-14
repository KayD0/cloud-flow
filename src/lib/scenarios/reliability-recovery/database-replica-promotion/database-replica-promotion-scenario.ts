export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type PromotionPhase = "healthy" | "primary-down" | "promoting" | "connection-switch" | "recovered";
export type ScenarioNotice = "none" | "promotion-rejected" | "switch-rejected";

export interface DatabaseReplicaPromotionState {
  playback: PlaybackState;
  phase: PromotionPhase;
  notice: ScenarioNotice;
}

export type DatabaseReplicaPromotionAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "fail-primary" }
  | { type: "promote-replica" }
  | { type: "switch-connection" };

export const initialDatabaseReplicaPromotionState: DatabaseReplicaPromotionState = {
  playback: "idle",
  phase: "healthy",
  notice: "none",
};

const nextPhase: Record<PromotionPhase, PromotionPhase> = {
  healthy: "primary-down",
  "primary-down": "promoting",
  promoting: "connection-switch",
  "connection-switch": "recovered",
  recovered: "recovered",
};

function applyPhase(state: DatabaseReplicaPromotionState, phase: PromotionPhase): DatabaseReplicaPromotionState {
  return { playback: phase === "recovered" ? "completed" : state.playback, phase, notice: "none" };
}

export function databaseReplicaPromotionReducer(state: DatabaseReplicaPromotionState, action: DatabaseReplicaPromotionAction): DatabaseReplicaPromotionState {
  switch (action.type) {
    case "start": return state.playback === "completed" ? { ...initialDatabaseReplicaPromotionState, playback: "running" } : { ...state, playback: "running", notice: "none" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialDatabaseReplicaPromotionState;
    case "tick": return state.playback === "running" ? applyPhase(state, nextPhase[state.phase]) : state;
    case "fail-primary": return state.phase === "healthy" ? applyPhase({ ...state, playback: "paused" }, "primary-down") : state;
    case "promote-replica":
      return state.phase === "primary-down" ? applyPhase({ ...state, playback: "paused" }, "promoting") : { ...state, playback: "paused", notice: "promotion-rejected" };
    case "switch-connection":
      if (state.phase === "promoting") return applyPhase({ ...state, playback: "paused" }, "connection-switch");
      if (state.phase === "connection-switch") return applyPhase({ ...state, playback: "paused" }, "recovered");
      return { ...state, playback: "paused", notice: "switch-rejected" };
  }
}

export function describeDatabaseReplicaPromotionState(state: DatabaseReplicaPromotionState): string {
  if (state.notice === "promotion-rejected") return "昇格は拒否されました。Primary の障害を確認する前に役割を変更すると、複数の書き込み先を生むおそれがあるためです。";
  if (state.notice === "switch-rejected") return "接続切り替えは拒否されました。Replica の昇格完了を確認してから書き込み先を変更してください。";
  if (state.playback === "paused") return "一時停止中です。Start で現在の状態から再開するか、個別操作で判断を進められます。";
  switch (state.phase) {
    case "healthy": return "初期状態です。Application は Primary に書き込み、Replica は待機しています。";
    case "primary-down": return "Primary の応答が停止しました。書き込みを止め、Replica を昇格できるか確認します。";
    case "promoting": return "Replica を新しい Primary へ昇格中です。まだ接続先は切り替えません。";
    case "connection-switch": return "昇格を確認し、Application の書き込み接続を新 Primary へ切り替えています。";
    case "recovered": return "接続切り替えが完了し、新 Primary への書き込みで提供を再開しました。";
  }
}

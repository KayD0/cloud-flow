export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type Operation = "write" | "read";
export type ReplicationMode = "sync" | "async";
export type ReadTarget = "primary" | "replica";
export type ScenarioOutcome = "waiting" | "write-replicated" | "read-fresh" | "read-stale";

export interface PrimaryReplicaState {
  playback: PlaybackState;
  operation: Operation;
  replicationMode: ReplicationMode;
  readTarget: ReadTarget;
  replicationLagMs: number;
  step: 0 | 1 | 2 | 3 | 4;
  outcome: ScenarioOutcome;
}

export type PrimaryReplicaAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-operation"; operation: Operation }
  | { type: "set-replication-mode"; mode: ReplicationMode }
  | { type: "set-read-target"; target: ReadTarget }
  | { type: "set-lag"; lagMs: number };

export const initialPrimaryReplicaState: PrimaryReplicaState = {
  playback: "idle", operation: "write", replicationMode: "async", readTarget: "replica",
  replicationLagMs: 800, step: 0, outcome: "waiting",
};

function configure(state: PrimaryReplicaState, change: Partial<PrimaryReplicaState>): PrimaryReplicaState {
  return { ...state, ...change, playback: "idle", step: 0, outcome: "waiting" };
}

function completionOutcome(state: PrimaryReplicaState): ScenarioOutcome {
  if (state.operation === "write") return "write-replicated";
  if (state.readTarget === "primary" || state.replicationMode === "sync" || state.replicationLagMs === 0) return "read-fresh";
  return "read-stale";
}

export function primaryReplicaReducer(state: PrimaryReplicaState, action: PrimaryReplicaAction): PrimaryReplicaState {
  switch (action.type) {
    case "start": return state.playback === "completed" ? { ...state, playback: "running", step: 0, outcome: "waiting" } : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialPrimaryReplicaState;
    case "set-operation": return configure(state, { operation: action.operation });
    case "set-replication-mode": return configure(state, { replicationMode: action.mode });
    case "set-read-target": return configure(state, { readTarget: action.target });
    case "set-lag": return configure(state, { replicationLagMs: Math.max(0, Math.min(2000, action.lagMs)) });
    case "tick":
      if (state.playback !== "running") return state;
      if (state.step < 3) return { ...state, step: (state.step + 1) as 1 | 2 | 3 };
      return { ...state, step: 4, playback: "completed", outcome: completionOutcome(state) };
  }
}

export function getStateExplanation(state: PrimaryReplicaState): string {
  if (state.outcome === "write-replicated") return `${state.replicationMode === "sync" ? "同期" : "非同期"}複製で、Primary の合成値 v2 が Read Replica へ反映されました。`;
  if (state.outcome === "read-fresh") return `${state.readTarget === "primary" ? "Primary" : "Read Replica"} から最新の合成値 v2 を読み取りました。`;
  if (state.outcome === "read-stale") return `非同期複製の ${state.replicationLagMs}ms の遅延中に Read Replica を選んだため、古い合成値 v1 を読み取りました。`;
  if (state.playback === "paused") return "一時停止中です。Start で現在の位置から再開できます。";
  if (state.step === 3) return state.operation === "write" ? "Read Replica へ変更を適用しています。" : `${state.readTarget === "primary" ? "Primary" : "Read Replica"} から Reader へ応答しています。`;
  if (state.step === 2) return state.replicationMode === "sync" ? "Primary の確定と同時に Replica へ反映しています。" : `Replication queue で ${state.replicationLagMs}ms の遅延を表現しています。`;
  if (state.step === 1) return state.operation === "write" ? "Application が Primary へ合成値 v2 を書き込んでいます。" : "Application が Read の宛先を選択しています。";
  return "初期状態です。Read / Write と複製条件を選び、Start で合成シナリオを開始してください。";
}

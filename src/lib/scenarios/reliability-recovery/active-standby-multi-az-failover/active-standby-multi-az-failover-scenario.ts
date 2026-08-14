export type FailoverPhase = "active-healthy" | "down" | "standby-promoting" | "recovered";

export interface FailoverScenarioState {
  playback: "idle" | "running" | "paused";
  phase: FailoverPhase;
  promotionProgress: number;
  routedAz: "az-a" | "none" | "az-b";
  eventCount: number;
  outcome: "ready" | "failure-injected" | "failover-started" | "promotion-paused" | "recovery-confirmed" | "action-rejected";
  reason: string;
}

export type FailoverScenarioAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" }
  | { type: "inject-failure" } | { type: "begin-failover" } | { type: "confirm-recovery" };

export const initialFailoverScenarioState: FailoverScenarioState = {
  playback: "idle", phase: "active-healthy", promotionProgress: 0, routedAz: "az-a", eventCount: 0, outcome: "ready",
  reason: "Active は正常です。障害を注入するとヘルス判定と切り替え判断を確認できます。",
};

function reject(state: FailoverScenarioState, reason: string): FailoverScenarioState {
  return { ...state, outcome: "action-rejected", reason };
}

export function failoverScenarioReducer(state: FailoverScenarioState, action: FailoverScenarioAction): FailoverScenarioState {
  switch (action.type) {
    case "start": return { ...state, playback: "running", reason: state.phase === "standby-promoting" ? "Standby の昇格処理を進めています。" : state.reason };
    case "pause": return { ...state, playback: "paused", outcome: state.phase === "standby-promoting" ? "promotion-paused" : state.outcome, reason: state.phase === "standby-promoting" ? "昇格処理を一時停止しました。再開しても進捗は保持されます。" : state.reason };
    case "reset": return initialFailoverScenarioState;
    case "inject-failure":
      if (state.phase !== "active-healthy") return reject(state, "障害注入は Active Healthy のときだけ実行できます。");
      return { ...state, phase: "down", routedAz: "none", playback: "paused", eventCount: state.eventCount + 1, outcome: "failure-injected", reason: "Active のヘルスチェックが失敗しました。誤切り替えを避けるため、Standby はまだ待機しています。" };
    case "begin-failover":
      if (state.phase !== "down") return reject(state, "Failover は Active の障害判定後にだけ開始できます。");
      return { ...state, phase: "standby-promoting", promotionProgress: 0, playback: "running", eventCount: state.eventCount + 1, outcome: "failover-started", reason: "障害判定を根拠に Standby の昇格を開始しました。完了まではトラフィックを流しません。" };
    case "tick": {
      if (state.playback !== "running" || state.phase !== "standby-promoting" || state.promotionProgress >= 100) return state;
      const promotionProgress = Math.min(100, state.promotionProgress + 25);
      return { ...state, promotionProgress, playback: promotionProgress === 100 ? "paused" : state.playback, reason: promotionProgress === 100 ? "Standby の昇格が完了しました。復旧確認でトラフィックを切り替えられます。" : `Standby の昇格処理は ${promotionProgress}% です。` };
    }
    case "confirm-recovery":
      if (state.phase !== "standby-promoting" || state.promotionProgress < 100) return reject(state, "Standby の昇格完了前は復旧確認できません。進捗が 100% になるまで待ちます。");
      return { ...state, phase: "recovered", routedAz: "az-b", playback: "paused", eventCount: state.eventCount + 1, outcome: "recovery-confirmed", reason: "Standby の健全性を確認し、AZ-B へトラフィックを切り替えました。" };
  }
}

export const failoverPhaseDetails: Record<FailoverPhase, { step: string; title: string; detail: string }> = {
  "active-healthy": { step: "01", title: "Active Healthy", detail: "AZ-A が要求を処理し、AZ-B は同期済みの待機系です。" },
  down: { step: "02", title: "Down", detail: "Active の障害を判定し、影響拡大を避けるため経路を遮断しています。" },
  "standby-promoting": { step: "03", title: "Standby Promoting", detail: "AZ-B を Active として安全に引き継げる状態へ昇格しています。" },
  recovered: { step: "04", title: "Recovered", detail: "昇格後の健全性を確認し、AZ-B でサービスを復旧しました。" },
};

export type GameMode = "guided" | "challenge";
export type GamePhase = "ready" | "playing" | "paused" | "won" | "lost";
export type RouteChoice = "private" | "public";
export type RequestOutcome = "private" | "public" | "blocked";

export const TOTAL_REQUESTS = 3;

export interface RequestResult {
  requestNumber: number;
  outcome: RequestOutcome;
}

export interface PrivateEndpointState {
  mode: GameMode;
  phase: GamePhase;
  endpointPlaced: boolean;
  selectedRoute: RouteChoice;
  completedRequests: number;
  attempts: number;
  blockedAttempts: number;
  lastResult?: RequestResult;
}

export interface ChallengeScore {
  safety: number;
  accuracy: number;
  availability: number;
  total: number;
  rank: "S" | "A" | "B" | "C";
}

export type PrivateEndpointAction =
  | { type: "select-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "toggle-endpoint" }
  | { type: "select-route"; route: RouteChoice }
  | { type: "send-request" };

export const initialPrivateEndpointState: PrivateEndpointState = {
  mode: "guided",
  phase: "ready",
  endpointPlaced: false,
  selectedRoute: "private",
  completedRequests: 0,
  attempts: 0,
  blockedAttempts: 0,
};

function resetForMode(mode: GameMode): PrivateEndpointState {
  return { ...initialPrivateEndpointState, mode };
}

export function privateEndpointReducer(
  state: PrivateEndpointState,
  action: PrivateEndpointAction,
): PrivateEndpointState {
  switch (action.type) {
    case "select-mode":
      return resetForMode(action.mode);
    case "start":
      return state.phase === "ready" || state.phase === "paused"
        ? { ...state, phase: "playing" }
        : state;
    case "pause":
      return state.phase === "playing" ? { ...state, phase: "paused" } : state;
    case "reset":
      return resetForMode(state.mode);
    case "toggle-endpoint":
      return state.phase === "ready" || state.phase === "playing"
        ? { ...state, endpointPlaced: !state.endpointPlaced, lastResult: undefined }
        : state;
    case "select-route":
      return state.phase === "ready" || state.phase === "playing"
        ? { ...state, selectedRoute: action.route, lastResult: undefined }
        : state;
    case "send-request": {
      if (state.phase !== "playing") return state;

      const attempts = state.attempts + 1;
      const requestNumber = state.completedRequests + 1;
      if (state.selectedRoute === "public") {
        return {
          ...state,
          phase: "lost",
          attempts,
          lastResult: { requestNumber, outcome: "public" },
        };
      }

      if (!state.endpointPlaced) {
        return {
          ...state,
          attempts,
          blockedAttempts: state.blockedAttempts + 1,
          lastResult: { requestNumber, outcome: "blocked" },
        };
      }

      const completedRequests = state.completedRequests + 1;
      return {
        ...state,
        attempts,
        completedRequests,
        phase: completedRequests === TOTAL_REQUESTS ? "won" : "playing",
        lastResult: { requestNumber, outcome: "private" },
      };
    }
  }
}

export function getChallengeScore(state: PrivateEndpointState): ChallengeScore {
  const safety = state.lastResult?.outcome === "public" ? 0 : 100;
  const accuracy = state.attempts === 0
    ? 0
    : Math.round((state.completedRequests / state.attempts) * 100);
  const availability = Math.round((state.completedRequests / TOTAL_REQUESTS) * 100);
  const total = Math.round(safety * 0.5 + accuracy * 0.3 + availability * 0.2);
  const rank = total >= 95 ? "S" : total >= 80 ? "A" : total >= 60 ? "B" : "C";
  return { safety, accuracy, availability, total, rank };
}

export function getResultExplanation(state: PrivateEndpointState): string {
  switch (state.lastResult?.outcome) {
    case "private":
      return "Private Endpoint がプライベートネットワーク内の接続先となり、Request は Public Internet を経由せず Managed Service に到達しました。";
    case "public":
      return "Public Route を選んだため Request が公開境界へ流出しました。到達できても、今回の目的である非公開経路は満たしません。";
    case "blocked":
      return "Private Route を選びましたが Private Endpoint が未配置です。非公開の接続先がないため、安全に遮断されました。Endpoint を配置して再確認できます。";
    default:
      return "Endpoint の有無と経路を選び、通信確認で選択の結果を確かめます。";
  }
}

export function getGuidance(state: PrivateEndpointState): string {
  if (state.phase === "ready") return "まず Start。次に Managed Service の非公開の接続先を用意します。";
  if (state.phase === "paused") return "一時停止中です。Start で同じ状態から再開できます。";
  if (!state.endpointPlaced) return "手順 1: Private Endpoint を配置してください。未配置のまま通信確認すると、安全に遮断される境界ケースを試せます。";
  if (state.selectedRoute !== "private") return "手順 2: Public Internet を避けるため Private Route を選びます。";
  return `手順 3: 通信確認を実行します。残り ${TOTAL_REQUESTS - state.completedRequests} Request です。`;
}

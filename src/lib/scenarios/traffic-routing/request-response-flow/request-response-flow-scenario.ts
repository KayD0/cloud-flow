export type GameMode = "guided" | "challenge";
export type GameStatus = "briefing" | "playing" | "paused" | "won" | "failed";
export type RelayLeg = "request" | "response";
export type RouteId = "api-server" | "asset-server" | "client" | "archive";
export type FailureReason = "misdelivery" | "timeout" | "server-unavailable" | null;

export const ROUND_DURATION_SECONDS = 60;

export const ROUTES = [
  { id: "api-server", label: "API Server", shape: "hexagon", hint: "動的なプロフィール要求を処理する" },
  { id: "asset-server", label: "Asset Server", shape: "square", hint: "画像などの静的ファイルを配信する" },
  { id: "client", label: "Client", shape: "circle", hint: "要求元へ応答を返す" },
  { id: "archive", label: "Archive", shape: "diamond", hint: "履歴を保管する（今回の宛先ではない）" },
] as const;

export interface RequestResponseFlowState {
  mode: GameMode;
  status: GameStatus;
  leg: RelayLeg;
  selectedRoute: RouteId | null;
  timeRemaining: number;
  elapsedSeconds: number;
  decisions: number;
  correctDecisions: number;
  failureReason: FailureReason;
  serverUnavailable: boolean;
  feedback: string;
}

export type RequestResponseFlowAction =
  | { type: "set-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "select-route"; route: RouteId }
  | { type: "send" }
  | { type: "tick" }
  | { type: "set-server-unavailable"; enabled: boolean }
  | { type: "reset" };

export function createInitialState(mode: GameMode = "guided"): RequestResponseFlowState {
  return {
    mode,
    status: "briefing",
    leg: "request",
    selectedRoute: null,
    timeRemaining: ROUND_DURATION_SECONDS,
    elapsedSeconds: 0,
    decisions: 0,
    correctDecisions: 0,
    failureReason: null,
    serverUnavailable: false,
    feedback: "要求カードを確認し、最初の配送先を選びます。",
  };
}

export const initialRequestResponseFlowState = createInitialState();

export function expectedRoute(leg: RelayLeg): RouteId {
  return leg === "request" ? "api-server" : "client";
}

export function calculateScore(state: RequestResponseFlowState): number {
  if (state.status !== "won") return 0;
  const accuracy = state.decisions === 0 ? 0 : state.correctDecisions / state.decisions;
  return Math.round(accuracy * 700 + (state.timeRemaining / ROUND_DURATION_SECONDS) * 300);
}

export function getResultExplanation(state: RequestResponseFlowState): string {
  if (state.status === "won") {
    return "往路では要求の種類に合う Server を選び、復路では Response を要求元の Client へ返したため、往復通信が成立しました。";
  }
  if (state.failureReason === "misdelivery") {
    return state.leg === "request"
      ? "プロフィール要求は動的処理が必要です。要求の種類と Server の役割が一致しないため、Response を生成できません。"
      : "Response の宛先は要求元の Client です。別の経路では、要求と応答を同じ通信として完了できません。";
  }
  if (state.failureReason === "server-unavailable") {
    return "経路は正しくても API Server が利用不能なため、Response を生成できません。可用性も往復通信の成立条件です。";
  }
  if (state.failureReason === "timeout") {
    return "制限時間内に Response が Client へ戻らず、往復通信が完了しませんでした。";
  }
  return state.feedback;
}

function send(state: RequestResponseFlowState): RequestResponseFlowState {
  if (state.status !== "playing" || state.selectedRoute === null) return state;
  const decisions = state.decisions + 1;
  if (state.selectedRoute !== expectedRoute(state.leg)) {
    return { ...state, status: "failed", decisions, failureReason: "misdelivery", feedback: "誤配送です。経路の役割を確認してください。" };
  }
  if (state.leg === "request" && state.serverUnavailable) {
    return { ...state, status: "failed", decisions, correctDecisions: state.correctDecisions + 1, failureReason: "server-unavailable", feedback: "API Server が応答できません。" };
  }
  if (state.leg === "request") {
    return {
      ...state,
      leg: "response",
      selectedRoute: null,
      decisions,
      correctDecisions: state.correctDecisions + 1,
      feedback: "正解。API Server が要求を処理し、Response を生成しました。要求元への復路を選びます。",
    };
  }
  return {
    ...state,
    status: "won",
    decisions,
    correctDecisions: state.correctDecisions + 1,
    feedback: "往復完了。Response が要求元の Client に届きました。",
  };
}

export function requestResponseFlowReducer(
  state: RequestResponseFlowState,
  action: RequestResponseFlowAction,
): RequestResponseFlowState {
  switch (action.type) {
    case "set-mode": return createInitialState(action.mode);
    case "start": return state.status === "briefing" ? { ...state, status: "playing", feedback: "GET /profile を処理できる配送先を選択してください。" } : state;
    case "pause": return state.status === "playing" ? { ...state, status: "paused" } : state;
    case "resume": return state.status === "paused" ? { ...state, status: "playing" } : state;
    case "select-route": return state.status === "playing" ? { ...state, selectedRoute: action.route } : state;
    case "send": return send(state);
    case "tick": {
      if (state.status !== "playing") return state;
      const timeRemaining = Math.max(0, state.timeRemaining - 1);
      if (timeRemaining === 0) return { ...state, timeRemaining, elapsedSeconds: state.elapsedSeconds + 1, status: "failed", failureReason: "timeout", feedback: "タイムアウトしました。" };
      return { ...state, timeRemaining, elapsedSeconds: state.elapsedSeconds + 1 };
    }
    case "set-server-unavailable": return state.status === "briefing" ? { ...state, serverUnavailable: action.enabled } : state;
    case "reset": return createInitialState(state.mode);
  }
}

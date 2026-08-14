export type BackendId = "web" | "api" | "admin";
export type RuleId = "api-rule" | "admin-rule" | "default-rule";
export type GameMode = "guided" | "challenge";
export type GameStatus = "ready" | "playing" | "paused" | "won" | "lost";

export interface RoutingRule {
  id: RuleId;
  label: string;
  host: string;
  pathPrefix: string;
  backend: BackendId;
  isDefault: boolean;
}

export interface RoutingRequest {
  id: string;
  host: string;
  path: string;
  expectedRuleId: RuleId;
  reason: string;
  hint: string;
}

export interface RoutingGameState {
  mode: GameMode;
  status: GameStatus;
  roundIndex: number;
  selectedRuleId: RuleId | null;
  correctCount: number;
  mistakes: number;
  safetyBonus: number;
  feedback: string;
}

export type RoutingGameAction =
  | { type: "set-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "select-rule"; ruleId: RuleId }
  | { type: "route-request" }
  | { type: "next-request" }
  | { type: "reset" };

export const routingRules: readonly RoutingRule[] = [
  { id: "api-rule", label: "API専用ルール", host: "app.learn.local", pathPrefix: "/api", backend: "api", isDefault: false },
  { id: "admin-rule", label: "管理画面ルール", host: "admin.learn.local", pathPrefix: "/", backend: "admin", isDefault: false },
  { id: "default-rule", label: "Default Route", host: "*", pathPrefix: "/", backend: "web", isDefault: true },
];

export const routingRequests: readonly RoutingRequest[] = [
  {
    id: "api-orders",
    host: "app.learn.local",
    path: "/api/orders",
    expectedRuleId: "api-rule",
    reason: "Host が一致し、Path が /api で始まるため、API専用ルールが最も具体的です。",
    hint: "まずHostを照合し、次にPath prefixを確認します。",
  },
  {
    id: "web-guide",
    host: "app.learn.local",
    path: "/guide",
    expectedRuleId: "default-rule",
    reason: "専用ルールに一致しない通常ページなので、Default RouteでWeb Serviceへ配送します。",
    hint: "専用Hostにも /api にも一致しない場合だけDefault Routeを使います。",
  },
  {
    id: "admin-settings",
    host: "admin.learn.local",
    path: "/settings",
    expectedRuleId: "admin-rule",
    reason: "Pathより先にHost条件が管理画面ルールへ一致し、Admin Serviceが選ばれます。",
    hint: "Pathが / で始まるルールが複数あっても、Hostが具体的なルールを優先します。",
  },
  {
    id: "api-boundary",
    host: "app.learn.local",
    path: "/api",
    expectedRuleId: "api-rule",
    reason: "/api 自体も prefix 条件に一致します。Default Routeへ逃がさずAPI Serviceへ配送します。",
    hint: "prefix一致には、prefixと完全に同じPathも含まれます。",
  },
];

export function createInitialRoutingGameState(mode: GameMode = "guided"): RoutingGameState {
  return {
    mode,
    status: "ready",
    roundIndex: 0,
    selectedRuleId: null,
    correctCount: 0,
    mistakes: 0,
    safetyBonus: 0,
    feedback: "モードを選び、Startで最初のRequestを受け取ってください。",
  };
}

export const initialRoutingGameState = createInitialRoutingGameState();

export function scoreRoutingGame(state: RoutingGameState) {
  const accuracy = Math.round((state.correctCount / routingRequests.length) * 100);
  return { accuracy, safety: state.safetyBonus, total: accuracy + state.safetyBonus };
}

export function routingGameReducer(state: RoutingGameState, action: RoutingGameAction): RoutingGameState {
  switch (action.type) {
    case "set-mode":
      return createInitialRoutingGameState(action.mode);
    case "start":
      if (state.status === "ready" || state.status === "paused") {
        return { ...state, status: "playing", feedback: "RequestのHostとPathを読み、配送ルールを選んでください。" };
      }
      return state;
    case "pause":
      return state.status === "playing"
        ? { ...state, status: "paused", feedback: "一時停止中です。Startで同じRequestから再開できます。" }
        : state;
    case "select-rule":
      return state.status === "playing" ? { ...state, selectedRuleId: action.ruleId } : state;
    case "route-request": {
      if (state.status !== "playing" || state.selectedRuleId === null) return state;
      const request = routingRequests[state.roundIndex];
      const selected = routingRules.find((rule) => rule.id === state.selectedRuleId)!;
      if (state.selectedRuleId !== request.expectedRuleId) {
        const defaultMisuse = selected.isDefault && request.expectedRuleId !== "default-rule";
        return {
          ...state,
          status: "lost",
          mistakes: state.mistakes + 1,
          feedback: defaultMisuse
            ? `配送失敗: ${request.reason} Default Routeは専用条件に一致しないRequestだけに使います。`
            : `誤ルート: ${request.reason}`,
        };
      }
      const isLast = state.roundIndex === routingRequests.length - 1;
      return {
        ...state,
        status: isLast ? "won" : "paused",
        correctCount: state.correctCount + 1,
        safetyBonus: state.safetyBonus + (request.expectedRuleId !== "default-rule" ? 5 : 10),
        feedback: `配送成功: ${request.reason}`,
      };
    }
    case "next-request":
      if (state.status !== "paused" || state.correctCount !== state.roundIndex + 1) return state;
      return {
        ...state,
        status: "playing",
        roundIndex: state.roundIndex + 1,
        selectedRuleId: null,
        feedback: "次のRequestです。HostとPathの両方を確認してください。",
      };
    case "reset":
      return createInitialRoutingGameState(state.mode);
  }
}

export type BackendId = "web" | "api" | "admin";
export type RuleId = "api-rule" | "web-rule" | "admin-rule";
export type RoutingPhase = "initial" | "inspect-request" | "evaluating" | "matched" | "delivered" | "no-match";

export interface RoutingRule {
  id: RuleId;
  label: string;
  host: string;
  pathPrefix: string;
  backend: BackendId;
  priority: number;
}

export interface RoutingState {
  playback: "idle" | "running" | "paused";
  phase: RoutingPhase;
  host: string;
  path: string;
  rules: readonly RoutingRule[];
  evaluationIndex: number | null;
  matchedRuleId: RuleId | null;
  destination: BackendId | null;
  explanation: string;
}

export type RoutingAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-host"; host: string }
  | { type: "set-path"; path: string }
  | { type: "move-rule"; ruleId: RuleId; direction: "up" | "down" }
  | { type: "tick" };

export const initialRoutingRules: readonly RoutingRule[] = [
  { id: "api-rule", label: "API path", host: "app.learn.local", pathPrefix: "/api", backend: "api", priority: 1 },
  { id: "web-rule", label: "Web fallback", host: "app.learn.local", pathPrefix: "/", backend: "web", priority: 2 },
  { id: "admin-rule", label: "Admin host", host: "admin.learn.local", pathPrefix: "/", backend: "admin", priority: 3 },
];

export const initialRoutingState: RoutingState = {
  playback: "idle",
  phase: "initial",
  host: "app.learn.local",
  path: "/api/orders",
  rules: initialRoutingRules,
  evaluationIndex: null,
  matchedRuleId: null,
  destination: null,
  explanation: "HostとPathを設定し、Startで合成リクエストを送信します。",
};

export function orderedRules(rules: readonly RoutingRule[]) {
  return [...rules].sort((left, right) => left.priority - right.priority);
}

export function ruleMatches(rule: RoutingRule, host: string, path: string) {
  return rule.host === host && path.startsWith(rule.pathPrefix);
}

function returnToInitial(state: RoutingState, changes: Partial<RoutingState>): RoutingState {
  return {
    ...state,
    ...changes,
    playback: "idle",
    phase: "initial",
    evaluationIndex: null,
    matchedRuleId: null,
    destination: null,
    explanation: "条件が変わりました。Startで新しい合成リクエストを評価します。",
  };
}

function moveRule(state: RoutingState, ruleId: RuleId, direction: "up" | "down") {
  const rules = orderedRules(state.rules);
  const index = rules.findIndex((rule) => rule.id === ruleId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= rules.length) return state;
  const current = rules[index];
  const other = rules[swapIndex];
  const reordered = rules.map((rule) => {
    if (rule.id === current.id) return { ...rule, priority: other.priority };
    if (rule.id === other.id) return { ...rule, priority: current.priority };
    return rule;
  });
  return returnToInitial(state, { rules: orderedRules(reordered) });
}

function tick(state: RoutingState): RoutingState {
  if (state.playback !== "running") return state;
  const rules = orderedRules(state.rules);
  if (state.phase === "inspect-request") {
    return { ...state, phase: "evaluating", evaluationIndex: 0, explanation: `優先順位1: ${rules[0].label} を評価しています。` };
  }
  if (state.phase === "evaluating" && state.evaluationIndex !== null) {
    const rule = rules[state.evaluationIndex];
    if (ruleMatches(rule, state.host, state.path)) {
      return { ...state, phase: "matched", matchedRuleId: rule.id, destination: rule.backend, explanation: `${rule.label} に一致しました。配送先は ${rule.backend.toUpperCase()} Backend です。` };
    }
    const nextIndex = state.evaluationIndex + 1;
    if (nextIndex < rules.length) {
      return { ...state, evaluationIndex: nextIndex, explanation: `${rule.label} は不一致です。次の ${rules[nextIndex].label} を評価します。` };
    }
    return { ...state, playback: "idle", phase: "no-match", explanation: "すべてのルールが不一致です。配送せず No match で完了しました。" };
  }
  if (state.phase === "matched") {
    return { ...state, playback: "idle", phase: "delivered", explanation: `${state.destination?.toUpperCase()} Backend への配送が完了しました（学習用の合成結果）。` };
  }
  return state;
}

export function routingReducer(state: RoutingState, action: RoutingAction): RoutingState {
  switch (action.type) {
    case "start":
      if (state.phase === "delivered" || state.phase === "no-match") {
        return { ...returnToInitial(state, {}), playback: "running", phase: "inspect-request", explanation: `Request属性 Host=${state.host}, Path=${state.path} を確認しています。` };
      }
      if (state.phase === "initial") {
        return { ...state, playback: "running", phase: "inspect-request", explanation: `Request属性 Host=${state.host}, Path=${state.path} を確認しています。` };
      }
      return { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused", explanation: `一時停止中: ${state.explanation}` } : state;
    case "reset":
      return initialRoutingState;
    case "set-host":
      return returnToInitial(state, { host: action.host });
    case "set-path":
      return returnToInitial(state, { path: action.path });
    case "move-rule":
      return moveRule(state, action.ruleId, action.direction);
    case "tick":
      return tick(state);
  }
}

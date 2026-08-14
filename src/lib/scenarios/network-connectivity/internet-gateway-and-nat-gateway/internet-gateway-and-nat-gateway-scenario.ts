export type GameMode = "guided" | "challenge";
export type CommunicationDirection = "ingress" | "egress";
export type GatewayChoice = "internetGateway" | "natGateway" | "direct";
export type GamePhase = "ready" | "playing" | "paused" | "feedback" | "won" | "lost";

export interface GatewayRound {
  id: string;
  request: string;
  source: string;
  destination: string;
  expectedDirection: CommunicationDirection;
  expectedGateway: GatewayChoice;
  kind: "public-ingress" | "private-egress" | "unsafe-private-ingress";
}

export const ROUNDS: readonly GatewayRound[] = [
  { id: "public-ingress", request: "公開サービスへ利用者リクエストを届ける", source: "Internet", destination: "Public Resource", expectedDirection: "ingress", expectedGateway: "internetGateway", kind: "public-ingress" },
  { id: "private-egress", request: "Private Resource から更新情報を取得する", source: "Private Resource", destination: "Internet", expectedDirection: "egress", expectedGateway: "natGateway", kind: "private-egress" },
  { id: "private-ingress", request: "Internet から Private Resource へ接続する", source: "Internet", destination: "Private Resource", expectedDirection: "ingress", expectedGateway: "direct", kind: "unsafe-private-ingress" },
] as const;

export interface DecisionResult {
  correct: boolean;
  safe: boolean;
  title: string;
  explanation: string;
}

export interface GatewayGameState {
  mode: GameMode;
  phase: GamePhase;
  roundIndex: number;
  direction: CommunicationDirection | null;
  gateway: GatewayChoice | null;
  score: number;
  correctAnswers: number;
  safetyViolations: number;
  lastResult: DecisionResult | null;
}

export type GatewayGameAction =
  | { type: "set-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "select-direction"; direction: CommunicationDirection }
  | { type: "select-gateway"; gateway: GatewayChoice }
  | { type: "submit" }
  | { type: "next" };

export const initialGatewayGameState: GatewayGameState = {
  mode: "guided", phase: "ready", roundIndex: 0, direction: null, gateway: null,
  score: 0, correctAnswers: 0, safetyViolations: 0, lastResult: null,
};

export function evaluateDecision(round: GatewayRound, direction: CommunicationDirection | null, gateway: GatewayChoice | null): DecisionResult {
  if (round.kind === "unsafe-private-ingress") {
    const rejected = direction === "ingress" && gateway !== "direct";
    if (rejected) return { correct: true, safe: true, title: "遮断成功", explanation: "Private Resource への直接 ingress は公開境界を越えて到達させません。外向き通信には NAT Gateway を使いますが、NAT Gateway は外部からの新規 ingress を受け付ける入口ではありません。" };
    if (gateway === "direct") return { correct: false, safe: false, title: "安全違反: 直接 ingress", explanation: "Private Resource を Internet へ直接公開すると、Private 境界を失います。この通信は通さず、公開受付が必要なら Public Resource を Internet Gateway 側に配置します。" };
    return { correct: false, safe: true, title: "方向判定が不一致", explanation: "通信は Internet から入ろうとしているため Ingress です。方向を正しく識別したうえで、Private Resource への到達を拒否します。" };
  }
  const correct = direction === round.expectedDirection && gateway === round.expectedGateway;
  if (correct && round.kind === "public-ingress") return { correct: true, safe: true, title: "Public ingress 成立", explanation: "Internet Gateway が Internet と Public Resource の境界を接続し、外部からの ingress を公開側へ届けます。" };
  if (correct) return { correct: true, safe: true, title: "Private egress 成立", explanation: "NAT Gateway が Private Resource の送信元を中継し、Internet Gateway 経由で egress を成立させます。外部から Private Resource への新規接続は開始できません。" };
  return { correct: false, safe: true, title: "経路不成立", explanation: round.kind === "public-ingress" ? "Public ingress の入口には Internet Gateway と Ingress の組み合わせが必要です。NAT Gateway は Private egress の中継役です。" : "Private egress は Egress を選び、最初に NAT Gateway で中継してから Internet Gateway へ進めます。" };
}

export function gatewayGameReducer(state: GatewayGameState, action: GatewayGameAction): GatewayGameState {
  switch (action.type) {
    case "set-mode": return { ...initialGatewayGameState, mode: action.mode };
    case "start": return state.phase === "ready" || state.phase === "paused" ? { ...state, phase: "playing" } : state;
    case "pause": return state.phase === "playing" ? { ...state, phase: "paused" } : state;
    case "reset": return { ...initialGatewayGameState, mode: state.mode };
    case "select-direction": return state.phase === "playing" ? { ...state, direction: action.direction } : state;
    case "select-gateway": return state.phase === "playing" ? { ...state, gateway: action.gateway } : state;
    case "submit": {
      if (state.phase !== "playing" || !state.direction || !state.gateway) return state;
      const result = evaluateDecision(ROUNDS[state.roundIndex], state.direction, state.gateway);
      const safetyPenalty = result.safe ? 0 : 40;
      return { ...state, phase: "feedback", lastResult: result, score: Math.max(0, state.score + (result.correct ? 100 : 0) - safetyPenalty), correctAnswers: state.correctAnswers + Number(result.correct), safetyViolations: state.safetyViolations + Number(!result.safe) };
    }
    case "next": {
      if (state.phase !== "feedback") return state;
      if (state.roundIndex === ROUNDS.length - 1) return { ...state, phase: state.correctAnswers === ROUNDS.length && state.safetyViolations === 0 ? "won" : "lost" };
      return { ...state, phase: "playing", roundIndex: state.roundIndex + 1, direction: null, gateway: null, lastResult: null };
    }
  }
}

export function getGuidance(state: GatewayGameState): string {
  const round = ROUNDS[state.roundIndex];
  if (state.mode === "challenge") return "方向と Gateway を判断し、管制を実行してください。正確性と安全性を採点します。";
  if (!state.direction) return round.kind === "private-egress" ? "まず通信の始点を見ます。Private Resource から外へ出るため Egress です。" : "まず通信の始点を見ます。Internet から入るため Ingress です。";
  if (!state.gateway) return round.kind === "public-ingress" ? "公開側の入口は Internet Gateway です。" : round.kind === "private-egress" ? "Private 側の外向き通信は NAT Gateway で中継します。" : "Private Resource への直接 ingress は「直接経路を試す」と何が危険か確認できます。";
  return "選択を確認し、「管制を実行」で結果と理由を確認しましょう。";
}

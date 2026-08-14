export type GameMode = "guided" | "challenge";
export type GamePhase = "ready" | "playing" | "paused" | "won" | "failed";
export type PeerChoice = "network-b" | "network-c" | null;
export type FailureReason = "cidr-overlap" | "one-way-route" | "missing-peer" | null;

export interface PeeringScore {
  accuracy: number;
  safety: number;
  completeness: number;
  total: number;
}

export interface VpcVnetPeeringState {
  mode: GameMode;
  phase: GamePhase;
  selectedPeer: PeerChoice;
  routeAToPeer: boolean;
  routePeerToA: boolean;
  checks: number;
  failureReason: FailureReason;
  score: PeeringScore | null;
}

export type VpcVnetPeeringAction =
  | { type: "set-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "select-peer"; peer: Exclude<PeerChoice, null> }
  | { type: "toggle-route"; direction: "a-to-peer" | "peer-to-a" }
  | { type: "check" };

export const initialVpcVnetPeeringState: VpcVnetPeeringState = {
  mode: "guided",
  phase: "ready",
  selectedPeer: null,
  routeAToPeer: false,
  routePeerToA: false,
  checks: 0,
  failureReason: null,
  score: null,
};

function freshState(mode: GameMode): VpcVnetPeeringState {
  return { ...initialVpcVnetPeeringState, mode };
}

export function calculatePeeringScore(
  selectedPeer: PeerChoice,
  routeAToPeer: boolean,
  routePeerToA: boolean,
  checks: number,
): PeeringScore {
  const accuracy = selectedPeer === "network-b" ? 40 : 0;
  const safety = selectedPeer !== "network-c" ? 30 : 0;
  const completeness = routeAToPeer && routePeerToA ? 30 : 0;
  const retryPenalty = Math.max(0, checks - 1) * 5;
  return {
    accuracy,
    safety,
    completeness,
    total: Math.max(0, accuracy + safety + completeness - retryPenalty),
  };
}

function checkConfiguration(state: VpcVnetPeeringState): VpcVnetPeeringState {
  const checks = state.checks + 1;
  const score = state.mode === "challenge"
    ? calculatePeeringScore(state.selectedPeer, state.routeAToPeer, state.routePeerToA, checks)
    : null;

  if (state.selectedPeer === null) {
    return { ...state, phase: "failed", checks, failureReason: "missing-peer", score };
  }
  if (state.selectedPeer === "network-c") {
    return { ...state, phase: "failed", checks, failureReason: "cidr-overlap", score };
  }
  if (!state.routeAToPeer || !state.routePeerToA) {
    return { ...state, phase: "failed", checks, failureReason: "one-way-route", score };
  }
  return { ...state, phase: "won", checks, failureReason: null, score };
}

export function vpcVnetPeeringReducer(
  state: VpcVnetPeeringState,
  action: VpcVnetPeeringAction,
): VpcVnetPeeringState {
  switch (action.type) {
    case "set-mode":
      return freshState(action.mode);
    case "start":
      return { ...state, phase: "playing", failureReason: null, score: null };
    case "pause":
      return state.phase === "playing" ? { ...state, phase: "paused" } : state;
    case "reset":
      return freshState(state.mode);
    case "select-peer":
      return state.phase === "playing"
        ? { ...state, selectedPeer: action.peer, failureReason: null, score: null }
        : state;
    case "toggle-route":
      if (state.phase !== "playing") return state;
      return action.direction === "a-to-peer"
        ? { ...state, routeAToPeer: !state.routeAToPeer, failureReason: null, score: null }
        : { ...state, routePeerToA: !state.routePeerToA, failureReason: null, score: null };
    case "check":
      return state.phase === "playing" ? checkConfiguration(state) : state;
  }
}

export function getGuidedStep(state: VpcVnetPeeringState): string {
  if (state.phase === "ready") return "Start を押して設計を始めましょう。";
  if (state.phase === "paused") return "Pause 中です。Start で設計を再開できます。";
  if (state.phase === "won" || state.phase === "failed") return "結果を確認し、Reset で同じシナリオに再挑戦しましょう。";
  if (state.selectedPeer === null) return "手順 1/3: Network A と CIDR が重複しない Peer を選びます。";
  if (state.selectedPeer === "network-c") return "Network C は A と CIDR が重複します。別の Peer を選びましょう。";
  if (!state.routeAToPeer || !state.routePeerToA) return "手順 2/3: 往路と復路の両方に Route を設定します。";
  return "手順 3/3: 疎通確認で双方向経路を検証します。";
}

export function describeVpcVnetPeeringState(state: VpcVnetPeeringState): string {
  if (state.phase === "won") {
    return "接続成功。CIDR が重複しない Network B を選び、往路と復路の Route が揃ったため、双方向通信が成立しました。";
  }
  if (state.failureReason === "cidr-overlap") {
    return "接続失敗。Network A と Network C は 10.10.0.0/16 が重複するため、Peering の経路を一意に決定できません。";
  }
  if (state.failureReason === "one-way-route") {
    return "疎通失敗。Peering だけでは通信は完成せず、送信側と返信側の両方に相手 CIDR への Route が必要です。";
  }
  if (state.failureReason === "missing-peer") {
    return "疎通失敗。接続先の Peer が未選択です。CIDR を比較して接続先を選んでください。";
  }
  if (state.phase === "paused") return "ゲームは一時停止中です。現在の設計は保持されています。";
  if (state.phase === "playing") return "設計中です。Peer と双方向 Route を設定して疎通確認してください。";
  return "開始前です。役割・目的・勝敗条件を確認して Start を押してください。";
}

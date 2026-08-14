export type GameMode = "guided" | "challenge";
export type TunnelStatus = "disconnected" | "connected" | "degraded";
export type Incident = "none" | "key-mismatch" | "route-mismatch";
export type KeyChoice = "key-alpha" | "key-bravo";
export type RouteChoice = "10.20.0.0/16" | "10.30.0.0/16";
export type GameResult = "playing" | "won" | "failed";

export interface VpnGameState {
  mode: GameMode;
  playback: "idle" | "running" | "paused";
  tunnel: TunnelStatus;
  incident: Incident;
  selectedKey: KeyChoice;
  selectedRoute: RouteChoice;
  result: GameResult;
  round: number;
  attempts: number;
  availability: number;
  score: number;
  feedback: string;
}

export type VpnGameAction =
  | { type: "set-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "establish" }
  | { type: "inject"; incident: Exclude<Incident, "none"> }
  | { type: "select-key"; key: KeyChoice }
  | { type: "select-route"; route: RouteChoice }
  | { type: "reconnect" };

export const initialVpnGameState: VpnGameState = {
  mode: "guided",
  playback: "idle",
  tunnel: "disconnected",
  incident: "none",
  selectedKey: "key-alpha",
  selectedRoute: "10.20.0.0/16",
  result: "playing",
  round: 1,
  attempts: 0,
  availability: 100,
  score: 0,
  feedback: "まず「Tunnel を確立」を選び、両 Gateway の鍵と経路が一致することを確認します。",
};

function scoreFor(attempts: number, availability: number) {
  const accuracy = Math.max(0, 50 - (attempts - 1) * 15);
  const safety = attempts === 1 ? 25 : 10;
  return Math.max(0, Math.min(100, accuracy + safety + Math.round(availability * 0.25)));
}

export function vpnGameReducer(state: VpnGameState, action: VpnGameAction): VpnGameState {
  switch (action.type) {
    case "set-mode":
      return { ...initialVpnGameState, mode: action.mode, feedback: action.mode === "guided" ? initialVpnGameState.feedback : "Challenge: 障害を注入し、正しい鍵と経路で最少試行の復旧を目指します。" };
    case "start":
      return { ...state, playback: "running", feedback: state.tunnel === "disconnected" ? "目標: Tunnel を確立してから切断イベントを発生させます。" : state.feedback };
    case "pause":
      return { ...state, playback: "paused", feedback: "一時停止中です。状態と判断理由を確認できます。" };
    case "reset":
      return { ...initialVpnGameState, mode: state.mode };
    case "establish":
      if (state.playback === "idle") return { ...state, feedback: "先に Start を選んでラウンドを開始してください。" };
      return { ...state, tunnel: "connected", incident: "none", result: "playing", feedback: "Tunnel 確立: 事前共有鍵と宛先経路が両 Gateway で一致し、暗号化された双方向経路が成立しました。" };
    case "inject":
      if (state.tunnel !== "connected") return { ...state, feedback: "障害注入には、確立済み Tunnel が必要です。" };
      return {
        ...state,
        tunnel: "degraded",
        incident: action.incident,
        availability: 75,
        selectedKey: action.incident === "key-mismatch" ? "key-bravo" : state.selectedKey,
        selectedRoute: action.incident === "route-mismatch" ? "10.30.0.0/16" : state.selectedRoute,
        feedback: action.incident === "key-mismatch"
          ? "切断: Gateway 間の事前共有鍵が一致せず、相互認証に失敗しています。"
          : "切断: Cloud 側宛先 10.20.0.0/16 と設定経路が一致せず、パケットを Tunnel へ転送できません。",
      };
    case "select-key":
      return { ...state, selectedKey: action.key, feedback: action.key === "key-alpha" ? "鍵 Alpha は対向 Gateway と一致します。次に経路を確認します。" : "鍵 Bravo は対向 Gateway と不一致です。このままでは認証できません。" };
    case "select-route":
      return { ...state, selectedRoute: action.route, feedback: action.route === "10.20.0.0/16" ? "10.20.0.0/16 は Cloud 側の合成ネットワーク範囲と一致します。" : "10.30.0.0/16 は宛先と不一致です。通信は誤った経路へ向かいます。" };
    case "reconnect": {
      if (state.incident === "none") return { ...state, feedback: "復旧対象の切断イベントがありません。先に障害を注入してください。" };
      const attempts = state.attempts + 1;
      const valid = state.selectedKey === "key-alpha" && state.selectedRoute === "10.20.0.0/16";
      if (!valid) return { ...state, attempts, tunnel: "disconnected", result: "failed", availability: Math.max(0, state.availability - 25), score: 0, feedback: state.selectedKey !== "key-alpha" ? "復旧失敗: 事前共有鍵が対向 Gateway と一致せず、相互認証できません。鍵 Alpha を確認してください。" : "復旧失敗: 宛先経路が Cloud 側ネットワークと一致せず、通信不能です。10.20.0.0/16 を確認してください。" };
      const availability = Math.max(0, state.availability - Math.max(0, attempts - 1) * 10);
      return { ...state, attempts, tunnel: "connected", incident: "none", result: "won", playback: "paused", availability, score: state.mode === "challenge" ? scoreFor(attempts, availability) : 100, feedback: "復旧成功: 鍵と経路が両 Gateway で一致し、Tunnel の認証とパケット転送が再開しました。" };
    }
  }
}

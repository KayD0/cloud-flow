export type ConnectionSource = "internet" | "internal";
export type ConnectionTarget = "public" | "private";
export type PlaybackState = "idle" | "running" | "paused" | "completed" | "blocked";

export interface PublicPrivateSubnetState {
  source: ConnectionSource;
  target: ConnectionTarget;
  gatewayEnabled: boolean;
  playback: PlaybackState;
  step: number;
  outcome: "pending" | "reachable" | "unreachable";
  statusName: string;
  explanation: string;
}

export type PublicPrivateSubnetAction =
  | { type: "set-source"; source: ConnectionSource }
  | { type: "set-target"; target: ConnectionTarget }
  | { type: "set-gateway"; enabled: boolean }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" };

export const initialPublicPrivateSubnetState: PublicPrivateSubnetState = {
  source: "internet",
  target: "public",
  gatewayEnabled: true,
  playback: "idle",
  step: 0,
  outcome: "pending",
  statusName: "Ready",
  explanation: "接続元・接続先・Gateway を選び、Start で合成パケットを送信します。",
};

function configuredState(state: PublicPrivateSubnetState): PublicPrivateSubnetState {
  return { ...state, playback: "idle", step: 0, outcome: "pending", statusName: "Ready", explanation: "設定を変更しました。Start で到達性を確認してください。" };
}

export function evaluateConnectivity(source: ConnectionSource, target: ConnectionTarget, gatewayEnabled: boolean) {
  if (source === "internal") {
    return { reachable: true, reason: `Internal Client は内部ルートを使うため、${target === "public" ? "Public" : "Private"} Subnet の Resource に到達できます。` };
  }
  if (target === "private") {
    return { reachable: false, reason: "Private Subnet の Resource には Internet から直接到達できる公開経路がありません。" };
  }
  if (!gatewayEnabled) {
    return { reachable: false, reason: "Internet から Public Subnet へ入る Gateway が無効なため、境界で停止しました。" };
  }
  return { reachable: true, reason: "有効な Gateway を経由して、Internet から Public Subnet の Resource に到達しました。" };
}

export function publicPrivateSubnetReducer(state: PublicPrivateSubnetState, action: PublicPrivateSubnetAction): PublicPrivateSubnetState {
  switch (action.type) {
    case "set-source": return configuredState({ ...state, source: action.source });
    case "set-target": return configuredState({ ...state, target: action.target });
    case "set-gateway": return configuredState({ ...state, gatewayEnabled: action.enabled });
    case "start":
      return { ...state, playback: "running", step: state.playback === "paused" ? state.step : 0, outcome: "pending", statusName: state.playback === "paused" ? "Resumed" : "Sending", explanation: "合成パケットが接続元から Subnet 境界へ移動しています。" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused", statusName: "Paused", explanation: "現在位置で一時停止しています。" } : state;
    case "reset": return initialPublicPrivateSubnetState;
    case "tick": {
      if (state.playback !== "running") return state;
      if (state.step < 2) {
        return { ...state, step: state.step + 1, statusName: state.step === 0 ? "At boundary" : "Evaluating route", explanation: state.step === 0 ? "合成パケットが Subnet 境界に到着しました。" : "接続元、接続先、Gateway の状態から到達性を判断しています。" };
      }
      const result = evaluateConnectivity(state.source, state.target, state.gatewayEnabled);
      return { ...state, step: 3, playback: result.reachable ? "completed" : "blocked", outcome: result.reachable ? "reachable" : "unreachable", statusName: result.reachable ? "Delivered" : "Blocked", explanation: result.reason };
    }
  }
}

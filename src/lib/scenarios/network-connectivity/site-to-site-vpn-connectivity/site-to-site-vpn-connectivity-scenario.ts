export const ENDPOINTS = {
  "on-prem-client": { label: "On-premises Client", side: "on-premises" },
  "on-prem-server": { label: "On-premises Server", side: "on-premises" },
  "cloud-app": { label: "Cloud Application", side: "cloud" },
  "cloud-database": { label: "Cloud Database", side: "cloud" },
} as const;

export type EndpointId = keyof typeof ENDPOINTS;
export type TunnelStatus = "disconnected" | "connecting" | "connected" | "disconnecting";
export interface Packet { id: number; progress: number; direction: "outbound" | "inbound"; }
export interface VpnScenarioState {
  playback: "idle" | "running" | "paused";
  tunnel: TunnelStatus;
  source: EndpointId;
  destination: EndpointId;
  packets: readonly Packet[];
  nextPacketId: number;
  deliveredPackets: number;
  blockedPackets: number;
  explanation: string;
}
export type VpnScenarioAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" }
  | { type: "connect" } | { type: "disconnect" }
  | { type: "set-source"; endpoint: EndpointId }
  | { type: "set-destination"; endpoint: EndpointId }
  | { type: "tick" };

export const initialVpnScenarioState: VpnScenarioState = {
  playback: "idle", tunnel: "disconnected", source: "on-prem-client", destination: "cloud-app",
  packets: [], nextPacketId: 1, deliveredPackets: 0, blockedPackets: 0,
  explanation: "初期状態: VPN Tunnel は切断されています。Connect Tunnel で合成接続を開始します。",
};

function routeDirection(source: EndpointId, destination: EndpointId) {
  if (ENDPOINTS[source].side === ENDPOINTS[destination].side) return undefined;
  return ENDPOINTS[source].side === "on-premises" ? "outbound" as const : "inbound" as const;
}

function tick(state: VpnScenarioState): VpnScenarioState {
  if (state.tunnel === "connecting") return { ...state, tunnel: "connected", explanation: "完了状態: 合成 VPN Tunnel が確立され、両ネットワーク間で通信できます。" };
  if (state.tunnel === "disconnecting") return { ...state, playback: "paused", tunnel: "disconnected", packets: [], explanation: "切断完了: Tunnel がないため、ネットワーク間のパケットは転送されません。" };
  if (state.playback !== "running") return state;
  const direction = routeDirection(state.source, state.destination);
  if (!direction) return { ...state, blockedPackets: state.blockedPackets + 1, explanation: "境界ケース: 送信元と宛先が同じネットワークにあるため、VPN Gateway を通りません。" };
  if (state.tunnel !== "connected") return { ...state, blockedPackets: state.blockedPackets + 1, explanation: "転送失敗: Tunnel が切断されているため、パケットは Gateway で破棄されました。" };
  const advanced = state.packets.map((packet) => ({ ...packet, progress: packet.progress + .25 })).filter((packet) => packet.progress < 1);
  const completed = state.packets.length - advanced.length;
  return { ...state, packets: [...advanced, { id: state.nextPacketId, progress: 0, direction }], nextPacketId: state.nextPacketId + 1, deliveredPackets: state.deliveredPackets + completed, explanation: `${ENDPOINTS[state.source].label} から ${ENDPOINTS[state.destination].label} へ、VPN Gateway と暗号化 Tunnel を経由して転送中です。` };
}

export function vpnScenarioReducer(state: VpnScenarioState, action: VpnScenarioAction): VpnScenarioState {
  switch (action.type) {
    case "start": return { ...state, playback: "running", explanation: "再生中: 現在の経路条件を継続的に評価します。" };
    case "pause": return { ...state, playback: "paused", explanation: "一時停止中: 現在の状態を保持しています。" };
    case "reset": return initialVpnScenarioState;
    case "connect": return state.tunnel === "disconnected" ? { ...state, tunnel: "connecting", explanation: "接続中: 2つの VPN Gateway 間で合成 Tunnel を確立しています。" } : state;
    case "disconnect": return state.tunnel === "connected" || state.tunnel === "connecting" ? { ...state, tunnel: "disconnecting", explanation: "切断中: Tunnel を閉じ、転送中のパケットを停止します。" } : state;
    case "set-source": return { ...state, source: action.endpoint, packets: [], explanation: "送信元を変更しました。Start で経路を確認します。" };
    case "set-destination": return { ...state, destination: action.endpoint, packets: [], explanation: "宛先を変更しました。Start で経路を確認します。" };
    case "tick": return tick(state);
  }
}

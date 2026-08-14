import { describe, expect, it } from "vitest";
import { initialVpnScenarioState, vpnScenarioReducer, type VpnScenarioState } from "./site-to-site-vpn-connectivity-scenario";

describe("vpnScenarioReducer", () => {
  it("Tunnelを接続し、ネットワーク間のパケットを配送する", () => {
    let state = vpnScenarioReducer(vpnScenarioReducer(initialVpnScenarioState, { type: "connect" }), { type: "tick" });
    state = vpnScenarioReducer(state, { type: "start" });
    for (let count = 0; count < 6; count += 1) state = vpnScenarioReducer(state, { type: "tick" });
    expect(state.tunnel).toBe("connected");
    expect(state.deliveredPackets).toBeGreaterThan(0);
    expect(state.packets.every((packet) => packet.direction === "outbound")).toBe(true);
  });
  it("CloudからOn-premisesへの逆方向を表現する", () => {
    let state: VpnScenarioState = { ...initialVpnScenarioState, tunnel: "connected", source: "cloud-app", destination: "on-prem-server" };
    state = vpnScenarioReducer(vpnScenarioReducer(state, { type: "start" }), { type: "tick" });
    expect(state.packets[0]?.direction).toBe("inbound");
  });
  it("Tunnel切断時はパケットをブロックする", () => {
    const state = vpnScenarioReducer(vpnScenarioReducer(initialVpnScenarioState, { type: "start" }), { type: "tick" });
    expect(state.packets).toHaveLength(0);
    expect(state.blockedPackets).toBe(1);
    expect(state.explanation).toContain("Tunnel が切断");
  });
  it("同一ネットワーク内の通信はVPNを経由しない", () => {
    let state: VpnScenarioState = { ...initialVpnScenarioState, tunnel: "connected", destination: "on-prem-server" };
    state = vpnScenarioReducer(vpnScenarioReducer(state, { type: "start" }), { type: "tick" });
    expect(state.blockedPackets).toBe(1);
    expect(state.explanation).toContain("同じネットワーク");
  });
  it("切断完了時に転送中パケットを消去する", () => {
    const active = { ...initialVpnScenarioState, tunnel: "connected" as const, packets: [{ id: 1, progress: .5, direction: "outbound" as const }] };
    const state = vpnScenarioReducer(vpnScenarioReducer(active, { type: "disconnect" }), { type: "tick" });
    expect(state.tunnel).toBe("disconnected");
    expect(state.packets).toHaveLength(0);
  });
  it("Resetで合成した初期状態へ戻す", () => {
    const changed = { ...initialVpnScenarioState, tunnel: "connected" as const, deliveredPackets: 4 };
    expect(vpnScenarioReducer(changed, { type: "reset" })).toEqual(initialVpnScenarioState);
  });
});

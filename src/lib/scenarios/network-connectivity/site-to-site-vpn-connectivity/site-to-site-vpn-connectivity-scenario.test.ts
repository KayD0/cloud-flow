import { describe, expect, it } from "vitest";
import { initialVpnGameState, vpnGameReducer } from "./site-to-site-vpn-connectivity-scenario";

const started = vpnGameReducer(initialVpnGameState, { type: "start" });
const connected = vpnGameReducer(started, { type: "establish" });

describe("vpnGameReducer", () => {
  it("establishes a tunnel before an incident", () => expect(connected.tunnel).toBe("connected"));
  it("recovers a key mismatch with matching key and route", () => {
    let state = vpnGameReducer(connected, { type: "inject", incident: "key-mismatch" });
    state = vpnGameReducer(state, { type: "select-key", key: "key-alpha" });
    state = vpnGameReducer(state, { type: "reconnect" });
    expect(state.result).toBe("won");
    expect(state.tunnel).toBe("connected");
  });
  it("fails when the pre-shared key remains mismatched", () => {
    const state = vpnGameReducer(vpnGameReducer(connected, { type: "inject", incident: "key-mismatch" }), { type: "reconnect" });
    expect(state.result).toBe("failed");
    expect(state.feedback).toContain("事前共有鍵");
  });
  it("fails at the route boundary when the destination CIDR differs", () => {
    const state = vpnGameReducer(vpnGameReducer(connected, { type: "inject", incident: "route-mismatch" }), { type: "reconnect" });
    expect(state.result).toBe("failed");
    expect(state.feedback).toContain("宛先経路");
  });
  it("scores an accurate first-attempt challenge recovery at 94", () => {
    let state = vpnGameReducer(initialVpnGameState, { type: "set-mode", mode: "challenge" });
    state = vpnGameReducer(vpnGameReducer(state, { type: "start" }), { type: "establish" });
    state = vpnGameReducer(state, { type: "inject", incident: "route-mismatch" });
    state = vpnGameReducer(state, { type: "select-route", route: "10.20.0.0/16" });
    state = vpnGameReducer(state, { type: "reconnect" });
    expect(state.score).toBe(94);
  });
  it("reset returns the selected mode to the same synthetic initial state", () => {
    const state = vpnGameReducer({ ...connected, mode: "challenge", attempts: 3 }, { type: "reset" });
    expect(state).toEqual({ ...initialVpnGameState, mode: "challenge" });
  });
  it("does not inject an incident before the tunnel is connected", () => {
    const state = vpnGameReducer(started, { type: "inject", incident: "key-mismatch" });
    expect(state.incident).toBe("none");
  });
});

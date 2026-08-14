import { describe, expect, it } from "vitest";
import { gatewayScenarioReducer, getScenarioExplanation, initialGatewayScenarioState, type GatewayScenarioState } from "./internet-gateway-and-nat-gateway-scenario";

function runUntilSettled(state: GatewayScenarioState) {
  let next = gatewayScenarioReducer(state, { type: "start" });
  for (let count = 0; count < 5 && next.phase === "running"; count += 1) next = gatewayScenarioReducer(next, { type: "tick" });
  return next;
}

describe("gatewayScenarioReducer", () => {
  it("Ingress は Internet Gateway を経由して Public Resource へ到達する", () => {
    const state = runUntilSettled(initialGatewayScenarioState);
    expect(state).toMatchObject({ direction: "ingress", phase: "completed", step: 2 });
    expect(getScenarioExplanation(state)).toContain("Internet → Internet Gateway → Public Resource");
  });

  it("Egress は NAT Gateway と Internet Gateway を順に経由する", () => {
    const egress = gatewayScenarioReducer(initialGatewayScenarioState, { type: "set-direction", direction: "egress" });
    const state = runUntilSettled(egress);
    expect(state).toMatchObject({ direction: "egress", phase: "completed", step: 3 });
    expect(getScenarioExplanation(state)).toContain("Private Resource → NAT Gateway → Internet Gateway → Internet");
  });

  it("NAT Gateway が無効なら Private Resource の Egress を境界で停止する", () => {
    const egress = gatewayScenarioReducer(initialGatewayScenarioState, { type: "set-direction", direction: "egress" });
    const disabled = gatewayScenarioReducer(egress, { type: "set-gateway", gateway: "natGateway", enabled: false });
    const state = runUntilSettled(disabled);
    expect(state).toMatchObject({ phase: "blocked", step: 0 });
    expect(getScenarioExplanation(state)).toContain("NAT Gateway が無効");
  });

  it("Internet Gateway が無効なら Ingress を停止し、再有効化後に再開できる", () => {
    const disabled = gatewayScenarioReducer(initialGatewayScenarioState, { type: "set-gateway", gateway: "internetGateway", enabled: false });
    const blocked = runUntilSettled(disabled);
    expect(blocked).toMatchObject({ phase: "blocked", step: 0 });
    const enabled = gatewayScenarioReducer(blocked, { type: "set-gateway", gateway: "internetGateway", enabled: true });
    expect(runUntilSettled(enabled).phase).toBe("completed");
  });

  it("Pause 中の tick は状態を変えず、Reset は合成初期状態へ戻す", () => {
    const running = gatewayScenarioReducer(initialGatewayScenarioState, { type: "start" });
    const paused = gatewayScenarioReducer(running, { type: "pause" });
    expect(gatewayScenarioReducer(paused, { type: "tick" })).toBe(paused);
    expect(gatewayScenarioReducer({ ...paused, step: 1 }, { type: "reset" })).toEqual(initialGatewayScenarioState);
  });
});

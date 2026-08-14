import { describe, expect, it } from "vitest";
import { evaluateDecision, gatewayGameReducer, initialGatewayGameState, ROUNDS } from "./internet-gateway-and-nat-gateway-scenario";

describe("evaluateDecision", () => {
  it("Public ingress を Internet Gateway へ通す", () => expect(evaluateDecision(ROUNDS[0], "ingress", "internetGateway")).toMatchObject({ correct: true, safe: true }));
  it("Private egress を NAT Gateway へ通す", () => expect(evaluateDecision(ROUNDS[1], "egress", "natGateway")).toMatchObject({ correct: true, safe: true }));
  it("方向または Gateway が違うと経路不成立になる", () => expect(evaluateDecision(ROUNDS[1], "ingress", "internetGateway")).toMatchObject({ correct: false, safe: true }));
  it("Private Resource への直接 ingress を安全違反にする", () => expect(evaluateDecision(ROUNDS[2], "ingress", "direct")).toMatchObject({ correct: false, safe: false }));
  it("Private Resource への直接 ingress を Gateway 選択で拒否できる", () => expect(evaluateDecision(ROUNDS[2], "ingress", "natGateway")).toMatchObject({ correct: true, safe: true }));
  it("直接 ingress の拒否でも方向を誤ると正解にしない", () => expect(evaluateDecision(ROUNDS[2], "egress", "natGateway")).toMatchObject({ correct: false, safe: true }));
});

describe("gatewayGameReducer", () => {
  it("未選択では判定せず、Reset で同じ固定初期状態へ戻る", () => {
    const playing = gatewayGameReducer(initialGatewayGameState, { type: "start" });
    expect(gatewayGameReducer(playing, { type: "submit" })).toBe(playing);
    expect(gatewayGameReducer({ ...playing, score: 200, roundIndex: 2 }, { type: "reset" })).toEqual(initialGatewayGameState);
  });
  it("3問正解かつ安全違反なしで勝利し300点になる", () => {
    let state = gatewayGameReducer({ ...initialGatewayGameState, mode: "challenge" }, { type: "start" });
    for (const [direction, gateway] of [["ingress", "internetGateway"], ["egress", "natGateway"], ["ingress", "natGateway"]] as const) {
      state = gatewayGameReducer(state, { type: "select-direction", direction });
      state = gatewayGameReducer(state, { type: "select-gateway", gateway });
      state = gatewayGameReducer(state, { type: "submit" });
      state = gatewayGameReducer(state, { type: "next" });
    }
    expect(state).toMatchObject({ phase: "won", score: 300, correctAnswers: 3, safetyViolations: 0 });
  });
  it("安全違反は40点減点され敗北する", () => {
    const playing = { ...initialGatewayGameState, phase: "playing" as const, roundIndex: 2, direction: "ingress" as const, gateway: "direct" as const, score: 100 };
    const judged = gatewayGameReducer(playing, { type: "submit" });
    expect(judged).toMatchObject({ phase: "feedback", score: 60, safetyViolations: 1 });
    expect(gatewayGameReducer(judged, { type: "next" }).phase).toBe("lost");
  });
});

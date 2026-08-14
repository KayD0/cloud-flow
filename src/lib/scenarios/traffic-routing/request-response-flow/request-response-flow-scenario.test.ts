import { describe, expect, it } from "vitest";
import { calculateScore, createInitialState, requestResponseFlowReducer, ROUND_DURATION_SECONDS, type RequestResponseFlowAction, type RequestResponseFlowState } from "./request-response-flow-scenario";

function reduce(state: RequestResponseFlowState, actions: RequestResponseFlowAction[]) {
  return actions.reduce(requestResponseFlowReducer, state);
}

describe("リクエスト・リレー", () => {
  it("正しい Server と Client を選ぶと往復通信に勝利する", () => {
    const state = reduce(createInitialState("challenge"), [
      { type: "start" }, { type: "select-route", route: "api-server" }, { type: "send" },
      { type: "select-route", route: "client" }, { type: "send" },
    ]);
    expect(state.status).toBe("won");
    expect(state.correctDecisions).toBe(2);
    expect(calculateScore(state)).toBe(1000);
  });

  it("誤った Server への配送は失敗し、理由を保持する", () => {
    const state = reduce(createInitialState(), [
      { type: "start" }, { type: "select-route", route: "asset-server" }, { type: "send" },
    ]);
    expect(state).toMatchObject({ status: "failed", failureReason: "misdelivery", leg: "request" });
  });

  it("正しい経路でも Server が利用不能なら失敗する", () => {
    const state = reduce(createInitialState(), [
      { type: "set-server-unavailable", enabled: true }, { type: "start" },
      { type: "select-route", route: "api-server" }, { type: "send" },
    ]);
    expect(state).toMatchObject({ status: "failed", failureReason: "server-unavailable", correctDecisions: 1 });
  });

  it("残り1秒の tick でタイムアウトし、0未満にならない", () => {
    const state = requestResponseFlowReducer({ ...createInitialState(), status: "playing", timeRemaining: 1 }, { type: "tick" });
    expect(state).toMatchObject({ status: "failed", failureReason: "timeout", timeRemaining: 0 });
    expect(requestResponseFlowReducer(state, { type: "tick" }).timeRemaining).toBe(0);
  });

  it("Pause 中は時間が進まず、Reset は同じ固定初期状態へ戻す", () => {
    const paused = reduce(createInitialState("challenge"), [{ type: "start" }, { type: "pause" }]);
    expect(requestResponseFlowReducer(paused, { type: "tick" })).toBe(paused);
    expect(requestResponseFlowReducer({ ...paused, timeRemaining: ROUND_DURATION_SECONDS - 8 }, { type: "reset" })).toEqual(createInitialState("challenge"));
  });
});

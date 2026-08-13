import { describe, expect, it } from "vitest";
import { FLOW_STAGES, initialRequestResponseFlowState, requestResponseFlowReducer, type RequestResponseFlowState } from "./request-response-flow-scenario";

function reduce(state: RequestResponseFlowState, actions: Parameters<typeof requestResponseFlowReducer>[1][]) {
  return actions.reduce(requestResponseFlowReducer, state);
}

describe("requestResponseFlowReducer", () => {
  it("初期状態から Client → Gateway → Backend → Gateway → Client の順で完了する", () => {
    let state = requestResponseFlowReducer(initialRequestResponseFlowState, { type: "start" });
    const visited = [FLOW_STAGES[state.stageIndex].id];
    for (let count = 1; count < FLOW_STAGES.length; count += 1) {
      state = requestResponseFlowReducer(state, { type: "tick" });
      visited.push(FLOW_STAGES[state.stageIndex].id);
    }
    expect(visited).toEqual(["ready", "request-gateway", "request-backend", "response-gateway", "response-client"]);
    expect(state.playback).toBe("completed");
  });

  it("Pause 中の tick は進まず、Step は一段階だけ進める", () => {
    const paused = reduce(initialRequestResponseFlowState, [{ type: "start" }, { type: "tick" }, { type: "pause" }]);
    expect(requestResponseFlowReducer(paused, { type: "tick" })).toBe(paused);
    const stepped = requestResponseFlowReducer(paused, { type: "step" });
    expect(FLOW_STAGES[stepped.stageIndex].id).toBe("request-backend");
    expect(stepped.playback).toBe("paused");
  });

  it("遅延モードを切り替えても現在の進行状態を維持する", () => {
    const running = requestResponseFlowReducer(initialRequestResponseFlowState, { type: "start" });
    expect(requestResponseFlowReducer(running, { type: "set-delay", delayMode: "slow" }))
      .toMatchObject({ delayMode: "slow", playback: "running", stageIndex: 0 });
  });

  it("Backend timeout を有効にすると処理段階で失敗する", () => {
    const failed = reduce(initialRequestResponseFlowState, [
      { type: "set-backend-timeout", enabled: true }, { type: "start" },
      { type: "tick" }, { type: "tick" }, { type: "tick" },
    ]);
    expect(FLOW_STAGES[failed.stageIndex].id).toBe("request-backend");
    expect(failed.playback).toBe("failed");
  });

  it("Reset で合成した初期状態へ戻る", () => {
    const changed = reduce(initialRequestResponseFlowState, [
      { type: "set-delay", delayMode: "slow" }, { type: "set-backend-timeout", enabled: true },
      { type: "start" }, { type: "tick" },
    ]);
    expect(requestResponseFlowReducer(changed, { type: "reset" })).toEqual(initialRequestResponseFlowState);
  });
});

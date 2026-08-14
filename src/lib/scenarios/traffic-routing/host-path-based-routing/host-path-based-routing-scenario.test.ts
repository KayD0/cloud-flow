import { describe, expect, it } from "vitest";
import {
  createInitialRoutingGameState,
  routingGameReducer,
  routingRequests,
  scoreRoutingGame,
  type RoutingGameState,
} from "./host-path-based-routing-scenario";

function start(state = createInitialRoutingGameState()) {
  return routingGameReducer(state, { type: "start" });
}

function answer(state: RoutingGameState, ruleId: "api-rule" | "admin-rule" | "default-rule") {
  return routingGameReducer(
    routingGameReducer(state, { type: "select-rule", ruleId }),
    { type: "route-request" },
  );
}

describe("routingGameReducer", () => {
  it("全Requestを正しいルールへ連続配送すると勝利する", () => {
    let state = start(createInitialRoutingGameState("challenge"));
    for (const [index, request] of routingRequests.entries()) {
      state = answer(state, request.expectedRuleId);
      if (index < routingRequests.length - 1) state = routingGameReducer(state, { type: "next-request" });
    }
    expect(state.status).toBe("won");
    expect(state.correctCount).toBe(routingRequests.length);
    expect(scoreRoutingGame(state)).toEqual({ accuracy: 100, safety: 25, total: 125 });
  });

  it("API RequestでDefault Routeを誤用すると理由付きで失敗する", () => {
    const state = answer(start(), "default-rule");
    expect(state.status).toBe("lost");
    expect(state.mistakes).toBe(1);
    expect(state.feedback).toContain("Default Route");
  });

  it("専用ルールに一致しない通常PathではDefault Routeが正解になる", () => {
    const first = answer(start(), "api-rule");
    const second = routingGameReducer(first, { type: "next-request" });
    expect(answer(second, "default-rule").status).toBe("paused");
  });

  it("/api と完全一致する境界値もAPI prefixに一致する", () => {
    let state = start();
    for (let index = 0; index < routingRequests.length - 1; index += 1) {
      state = answer(state, routingRequests[index].expectedRuleId);
      state = routingGameReducer(state, { type: "next-request" });
    }
    expect(routingRequests[state.roundIndex].path).toBe("/api");
    expect(answer(state, "api-rule").status).toBe("won");
  });

  it("Pause中は選択できず、Resetで同じモードの固定初期状態へ戻る", () => {
    const running = start(createInitialRoutingGameState("challenge"));
    const paused = routingGameReducer(running, { type: "pause" });
    expect(routingGameReducer(paused, { type: "select-rule", ruleId: "api-rule" })).toBe(paused);
    expect(routingGameReducer(paused, { type: "reset" })).toEqual(createInitialRoutingGameState("challenge"));
  });
});

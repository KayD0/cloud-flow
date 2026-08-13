import { describe, expect, it } from "vitest";
import { initialRoutingState, orderedRules, routingReducer, type RoutingState } from "./host-path-based-routing-scenario";

function runToCompletion(state: RoutingState) {
  let current = routingReducer(state, { type: "start" });
  for (let count = 0; count < 8 && current.playback === "running"; count += 1) current = routingReducer(current, { type: "tick" });
  return current;
}

describe("routingReducer", () => {
  it("HostとPathに一致するAPI Backendへ優先ルールで配送する", () => {
    const state = runToCompletion(initialRoutingState);
    expect(state.phase).toBe("delivered");
    expect(state.destination).toBe("api");
    expect(state.matchedRuleId).toBe("api-rule");
  });

  it("catch-allルールを上位にすると同じRequestがWeb Backendへ配送される", () => {
    const reordered = routingReducer(initialRoutingState, { type: "move-rule", ruleId: "web-rule", direction: "up" });
    expect(orderedRules(reordered.rules).map((rule) => rule.id)).toEqual(["web-rule", "api-rule", "admin-rule"]);
    expect(runToCompletion(reordered).destination).toBe("web");
  });

  it("Admin HostをAdmin Backendへ配送する", () => {
    const state = routingReducer(initialRoutingState, { type: "set-host", host: "admin.learn.local" });
    expect(runToCompletion(state).destination).toBe("admin");
  });

  it("全ルール不一致をNo matchとして完了する", () => {
    const state = routingReducer(initialRoutingState, { type: "set-host", host: "unknown.learn.local" });
    const completed = runToCompletion(state);
    expect(completed.phase).toBe("no-match");
    expect(completed.destination).toBeNull();
  });

  it("Pause中のtickでは状態を進めない", () => {
    const running = routingReducer(initialRoutingState, { type: "start" });
    const paused = routingReducer(running, { type: "pause" });
    expect(routingReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Resetで合成した初期状態へ戻る", () => {
    const changed = runToCompletion(routingReducer(initialRoutingState, { type: "set-path", path: "/docs" }));
    expect(routingReducer(changed, { type: "reset" })).toEqual(initialRoutingState);
  });
});

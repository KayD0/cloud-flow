import { describe, expect, it } from "vitest";
import { evaluateEvent, eventBusRoutingReducer, initialEventBusRoutingState, type EventBusRoutingState } from "./event-bus-routing-scenario";

function runToCompletion(state: EventBusRoutingState) {
  let current = eventBusRoutingReducer(state, { type: "start" });
  for (let index = 0; index < 30 && current.playback !== "completed"; index += 1) current = eventBusRoutingReducer(current, { type: "tick" });
  return current;
}

describe("eventBusRoutingReducer", () => {
  it("初期イベントを3つの一致するConsumerへ配送して完了する", () => {
    const state = runToCompletion(initialEventBusRoutingState);
    expect(state.playback).toBe("completed"); expect(state.processedCount).toBe(1);
    expect(state.delivered).toEqual(["order-processor", "priority-monitor", "east-analytics"]);
  });
  it("イベント属性に一致するRuleだけを選ぶ", () => {
    const results = evaluateEvent({ id: 4, type: "customer.updated", priority: "normal", region: "east" }, { order: true, priority: true, east: true });
    expect(results.filter((result) => result.matched).map((result) => result.ruleId)).toEqual(["east"]);
  });
  it("無効なRuleは属性が一致しても配送しない", () => {
    const results = evaluateEvent({ id: 2, type: "order.created", priority: "high", region: "west" }, { order: false, priority: true, east: true });
    expect(results.find((result) => result.ruleId === "order")).toMatchObject({ matched: false, reason: "Rule is disabled" });
    expect(results.filter((result) => result.matched).map((result) => result.consumer)).toEqual(["priority-monitor"]);
  });
  it("すべてのRuleが不一致なら未配送の境界状態を通る", () => {
    let state = { ...initialEventBusRoutingState, enabledRules: { order: false, priority: false, east: false } };
    state = eventBusRoutingReducer(state, { type: "start" });
    for (let index = 0; index < 4; index += 1) state = eventBusRoutingReducer(state, { type: "tick" });
    expect(state.phase).toBe("unmatched"); expect(state.delivered).toEqual([]);
  });
  it("Pause中は進まず、Resetで合成した初期状態へ戻る", () => {
    const paused = eventBusRoutingReducer(eventBusRoutingReducer(initialEventBusRoutingState, { type: "start" }), { type: "pause" });
    expect(eventBusRoutingReducer(paused, { type: "tick" })).toBe(paused);
    expect(eventBusRoutingReducer(paused, { type: "reset" })).toEqual(initialEventBusRoutingState);
  });
  it("編集した属性のスナップショットをイベントとして投入する", () => {
    const edited = eventBusRoutingReducer(initialEventBusRoutingState, { type: "set-attribute", attribute: "region", value: "west" });
    const injected = eventBusRoutingReducer(edited, { type: "inject" });
    expect(injected.queue.at(-1)).toMatchObject({ id: 2, region: "west" }); expect(injected.nextEventId).toBe(3);
  });
});

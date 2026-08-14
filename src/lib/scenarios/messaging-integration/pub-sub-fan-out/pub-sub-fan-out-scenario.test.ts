import { describe, expect, it } from "vitest";
import {
  initialPubSubFanOutState,
  pubSubFanOutReducer,
  type PubSubFanOutAction,
  type PubSubFanOutState,
} from "./pub-sub-fan-out-scenario";

function reduce(state: PubSubFanOutState, actions: PubSubFanOutAction[]) {
  return actions.reduce(pubSubFanOutReducer, state);
}

describe("pubSubFanOutReducer", () => {
  it("Publish → Topic → fan-out → 配送完了の順で進む", () => {
    const published = pubSubFanOutReducer(initialPubSubFanOutState, { type: "publish" });
    expect(published).toMatchObject({ playback: "published", stageIndex: 1 });

    const completed = reduce(published, [{ type: "start" }, { type: "tick" }, { type: "tick" }]);
    expect(completed).toMatchObject({ playback: "completed", stageIndex: 3 });
    expect(Object.values(completed.subscribers).map((subscriber) => subscriber.delivery)).toEqual([
      "delivered", "delivered", "delivered",
    ]);
  });

  it("購読を無効にした Subscriber には配送しない", () => {
    const completed = reduce(initialPubSubFanOutState, [
      { type: "set-subscription", subscriberId: "b", enabled: false },
      { type: "publish" }, { type: "start" }, { type: "tick" }, { type: "tick" },
    ]);
    expect(completed.subscribers.a.delivery).toBe("delivered");
    expect(completed.subscribers.b.delivery).toBe("subscription-disabled");
    expect(completed.subscribers.c.delivery).toBe("delivered");
  });

  it("停止中の Subscriber は境界ケースとして配送失敗になる", () => {
    const completed = reduce(initialPubSubFanOutState, [
      { type: "set-stopped", subscriberId: "c", stopped: true },
      { type: "publish" }, { type: "start" }, { type: "tick" }, { type: "tick" },
    ]);
    expect(completed.subscribers.c.delivery).toBe("subscriber-stopped");
  });

  it("Pause 中は tick で進まず、Start で再開する", () => {
    const paused = reduce(initialPubSubFanOutState, [
      { type: "publish" }, { type: "start" }, { type: "pause" },
    ]);
    expect(pubSubFanOutReducer(paused, { type: "tick" })).toBe(paused);
    expect(pubSubFanOutReducer(paused, { type: "start" }).playback).toBe("running");
  });

  it("配送中の設定変更を無視し、Reset で合成した初期状態へ戻る", () => {
    const running = reduce(initialPubSubFanOutState, [{ type: "publish" }, { type: "start" }]);
    expect(pubSubFanOutReducer(running, { type: "set-subscription", subscriberId: "a", enabled: false })).toBe(running);
    expect(pubSubFanOutReducer(running, { type: "reset" })).toEqual(initialPubSubFanOutState);
  });
});

import { describe, expect, it } from "vitest";
import { getConsumerLag, getStateExplanation, initialStreamConsumerLagState, streamConsumerLagReducer } from "./stream-consumer-lag-scenario";

describe("streamConsumerLagReducer", () => {
  it("発行と Consumer ごとの処理量を cursor と Lag に反映する", () => {
    const running = streamConsumerLagReducer(initialStreamConsumerLagState, { type: "start" });
    const next = streamConsumerLagReducer(running, { type: "tick" });
    expect(next).toMatchObject({ streamOffset: 30, cursorA: 26, cursorB: 16, tick: 1 });
    expect(getConsumerLag(next, "a")).toBe(4);
    expect(getConsumerLag(next, "b")).toBe(14);
  });
  it("停止した Consumer の cursor を固定し Lag を増やす", () => {
    let state = streamConsumerLagReducer(initialStreamConsumerLagState, { type: "set-consumer-active", consumer: "b", active: false });
    state = streamConsumerLagReducer(state, { type: "start" });
    state = streamConsumerLagReducer(state, { type: "tick" });
    expect(state.cursorB).toBe(12);
    expect(getConsumerLag(state, "b")).toBe(18);
    expect(getStateExplanation(state)).toContain("停止中");
  });
  it("処理量が発行量以上なら既存 Lag を縮小する", () => {
    const next = streamConsumerLagReducer(streamConsumerLagReducer(initialStreamConsumerLagState, { type: "start" }), { type: "tick" });
    expect(getConsumerLag(next, "a")).toBeLessThan(getConsumerLag(initialStreamConsumerLagState, "a"));
  });
  it("値を範囲内に制限し、Pause 中の tick を無視する", () => {
    let state = streamConsumerLagReducer(initialStreamConsumerLagState, { type: "set-publish-rate", rate: 99 });
    state = streamConsumerLagReducer(state, { type: "start" });
    const paused = streamConsumerLagReducer(state, { type: "pause" });
    expect(paused.publishRate).toBe(12);
    expect(streamConsumerLagReducer(paused, { type: "tick" })).toBe(paused);
  });
  it("12 ステップで完了し Reset で合成初期状態へ戻る", () => {
    let state = streamConsumerLagReducer(initialStreamConsumerLagState, { type: "start" });
    for (let index = 0; index < 12; index += 1) state = streamConsumerLagReducer(state, { type: "tick" });
    expect(state.playback).toBe("completed");
    expect(streamConsumerLagReducer(state, { type: "reset" })).toEqual(initialStreamConsumerLagState);
  });
});

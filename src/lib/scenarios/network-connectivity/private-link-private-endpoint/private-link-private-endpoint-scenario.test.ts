import { describe, expect, it } from "vitest";
import {
  getChallengeScore,
  initialPrivateEndpointState,
  privateEndpointReducer,
  TOTAL_REQUESTS,
  type PrivateEndpointState,
} from "./private-link-private-endpoint-scenario";

function start(state = initialPrivateEndpointState) {
  return privateEndpointReducer(state, { type: "start" });
}

function preparePrivatePath(state = start()) {
  return privateEndpointReducer(state, { type: "toggle-endpoint" });
}

describe("プライベート・パス", () => {
  it("3 Request を Private Endpoint 経由で完了すると勝利する", () => {
    let state = preparePrivatePath();
    for (let count = 0; count < TOTAL_REQUESTS; count += 1) {
      state = privateEndpointReducer(state, { type: "send-request" });
    }
    expect(state).toMatchObject({ phase: "won", completedRequests: 3, attempts: 3 });
    expect(state.lastResult?.outcome).toBe("private");
    expect(getChallengeScore(state)).toEqual({ safety: 100, accuracy: 100, availability: 100, total: 100, rank: "S" });
  });

  it("Public Route へ流出すると直ちに失敗する", () => {
    let state = start();
    state = privateEndpointReducer(state, { type: "select-route", route: "public" });
    state = privateEndpointReducer(state, { type: "send-request" });
    expect(state).toMatchObject({ phase: "lost", completedRequests: 0, attempts: 1 });
    expect(state.lastResult?.outcome).toBe("public");
    expect(getChallengeScore(state).safety).toBe(0);
  });

  it("Endpoint 未配置の Private Route は遮断され、修正して続行できる", () => {
    let state = start();
    state = privateEndpointReducer(state, { type: "send-request" });
    expect(state).toMatchObject({ phase: "playing", completedRequests: 0, blockedAttempts: 1 });
    expect(state.lastResult?.outcome).toBe("blocked");

    state = privateEndpointReducer(state, { type: "toggle-endpoint" });
    state = privateEndpointReducer(state, { type: "send-request" });
    expect(state).toMatchObject({ completedRequests: 1, attempts: 2 });
    expect(getChallengeScore(state).accuracy).toBe(50);
  });

  it("Pause 中は通信確認も設定変更も受け付けない", () => {
    const paused = privateEndpointReducer(start(), { type: "pause" });
    expect(privateEndpointReducer(paused, { type: "send-request" })).toBe(paused);
    expect(privateEndpointReducer(paused, { type: "toggle-endpoint" })).toBe(paused);
  });

  it("Reset は選択中のモードを保って固定初期状態へ戻す", () => {
    let state: PrivateEndpointState = privateEndpointReducer(initialPrivateEndpointState, { type: "select-mode", mode: "challenge" });
    state = preparePrivatePath(state);
    state = privateEndpointReducer(state, { type: "send-request" });
    expect(privateEndpointReducer(state, { type: "reset" })).toEqual({
      ...initialPrivateEndpointState,
      mode: "challenge",
    });
  });

  it("終了後の追加 Request は状態を変えない", () => {
    let state = start();
    state = privateEndpointReducer(state, { type: "select-route", route: "public" });
    state = privateEndpointReducer(state, { type: "send-request" });
    expect(privateEndpointReducer(state, { type: "send-request" })).toBe(state);
  });
});

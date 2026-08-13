import { describe, expect, it } from "vitest";
import { cacheHitMissReducer, initialCacheHitMissState, type CacheHitMissState } from "./cache-hit-miss-scenario";

function runToCompletion(state: CacheHitMissState) {
  let current = cacheHitMissReducer(state, { type: "start" });
  for (let step = 0; step < 100 && current.playback !== "completed"; step += 1) {
    current = cacheHitMissReducer(current, { type: "tick" });
  }
  return current;
}

describe("cacheHitMissReducer", () => {
  it("Cold CacheではDatabaseを読み、Cacheを更新して応答する", () => {
    const state = runToCompletion({ ...initialCacheHitMissState, requestCount: 1 });
    expect(state).toMatchObject({ playback: "completed", hits: 0, misses: 1, databaseReads: 1, cacheUpdates: 1, cacheHasValue: true });
  });

  it("Fresh CacheではDatabaseへアクセスせずHIT応答する", () => {
    const state = runToCompletion({ ...initialCacheHitMissState, cachePreset: "warm", cacheHasValue: true, requestCount: 1 });
    expect(state).toMatchObject({ hits: 1, misses: 0, databaseReads: 0, cacheUpdates: 0 });
  });

  it("TTL境界ではageがTTLと等しいCacheを期限切れとして扱う", () => {
    const state = runToCompletion({ ...initialCacheHitMissState, cachePreset: "expired", cacheHasValue: true, cacheAge: 2, ttl: 2, requestCount: 1 });
    expect(state).toMatchObject({ hits: 0, misses: 1, databaseReads: 1 });
  });

  it("TTL 2秒でCold Cacheへ3回要求するとMISS、HIT、MISSになる", () => {
    const state = runToCompletion(initialCacheHitMissState);
    expect(state).toMatchObject({ completedRequests: 3, hits: 1, misses: 2, databaseReads: 2, cacheUpdates: 2 });
  });

  it("Pause中のtickでは状態を変更しない", () => {
    const paused = { ...initialCacheHitMissState, playback: "paused" as const, phase: "cache-check" as const, activeRequest: 1 };
    expect(cacheHitMissReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("実行開始後はCache、TTL、Request数を変更しない", () => {
    const running = cacheHitMissReducer(initialCacheHitMissState, { type: "start" });
    expect(cacheHitMissReducer(running, { type: "set-cache", cachePreset: "warm" })).toBe(running);
    expect(cacheHitMissReducer(running, { type: "set-ttl", ttl: 5 })).toBe(running);
    expect(cacheHitMissReducer(running, { type: "set-request-count", requestCount: 6 })).toBe(running);
  });

  it("Resetで合成したCold Cacheの初期状態へ戻す", () => {
    const completed = runToCompletion({ ...initialCacheHitMissState, cachePreset: "warm", cacheHasValue: true });
    expect(cacheHitMissReducer(completed, { type: "reset" })).toEqual(initialCacheHitMissState);
  });
});

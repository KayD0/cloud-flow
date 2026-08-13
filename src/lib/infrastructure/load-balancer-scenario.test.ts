import { describe, expect, it } from "vitest";
import {
  initialLoadBalancerState,
  loadBalancerReducer,
  type LoadBalancerState,
} from "./load-balancer-scenario";

function startAndTick(state: LoadBalancerState = initialLoadBalancerState) {
  return loadBalancerReducer(loadBalancerReducer(state, { type: "start" }), { type: "tick" });
}

describe("loadBalancerReducer", () => {
  it("HealthyなServerへRound Robinでリクエストを振り分ける", () => {
    const state = startAndTick({ ...initialLoadBalancerState, traffic: 5 });
    expect(state.requests.map((request) => request.target)).toEqual([
      "server-a",
      "server-b",
      "server-c",
      "server-a",
      "server-b",
    ]);
  });

  it("DownになったServerを以降の振り分け対象から除外する", () => {
    const failed = loadBalancerReducer(initialLoadBalancerState, { type: "fail", serverId: "server-b" });
    const state = startAndTick({ ...failed, traffic: 5 });
    expect(state.requests.map((request) => request.target)).toEqual([
      "server-a",
      "server-c",
      "server-a",
      "server-c",
      "server-a",
    ]);
    expect(state.servers["server-b"]).toBe("down");
  });

  it("全ServerがDownならリクエストを生成しない", () => {
    const state = startAndTick({
      ...initialLoadBalancerState,
      servers: { "server-a": "down", "server-b": "down", "server-c": "down" },
    });
    expect(state.requests).toHaveLength(0);
  });

  it("Pause中のtickでは状態を変更しない", () => {
    const paused = { ...initialLoadBalancerState, playback: "paused" as const };
    expect(loadBalancerReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("Resetで再生設定、障害、統計を初期化する", () => {
    const changed = {
      ...initialLoadBalancerState,
      playback: "running" as const,
      speed: 2,
      completedRequests: 8,
      servers: { ...initialLoadBalancerState.servers, "server-a": "down" as const },
    };
    expect(loadBalancerReducer(changed, { type: "reset" })).toEqual(initialLoadBalancerState);
  });
});

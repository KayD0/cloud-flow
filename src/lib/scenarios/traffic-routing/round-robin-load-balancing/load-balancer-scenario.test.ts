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
  it("正常な Backend へ Round Robin で順番に配送する", () => {
    const state = startAndTick({ ...initialLoadBalancerState, traffic: 5 });
    expect(state.requests.map((request) => request.target)).toEqual([
      "server-a",
      "server-b",
      "server-c",
      "server-a",
      "server-b",
    ]);
  });

  it("停止した Backend を配送先から除外し、復旧後に再参加させる", () => {
    const failed = loadBalancerReducer(initialLoadBalancerState, { type: "fail", serverId: "server-b" });
    const distributed = startAndTick({ ...failed, traffic: 3 });
    expect(distributed.requests.map((request) => request.target)).toEqual([
      "server-a",
      "server-c",
      "server-a",
    ]);

    const recovered = loadBalancerReducer(distributed, { type: "recover", serverId: "server-b" });
    const next = loadBalancerReducer(recovered, { type: "tick" });
    expect(next.requests.slice(-3).map((request) => request.target)).toEqual([
      "server-b",
      "server-c",
      "server-a",
    ]);
  });

  it("全 Backend 停止時は配送せず、拒否数を記録する", () => {
    const state = startAndTick({
      ...initialLoadBalancerState,
      traffic: 4,
      servers: { "server-a": "down", "server-b": "down", "server-c": "down" },
    });
    expect(state.requests).toHaveLength(0);
    expect(state.rejectedRequests).toBe(4);
  });

  it("Pause 中の tick では状態を変更しない", () => {
    const paused = { ...initialLoadBalancerState, playback: "paused" as const };
    expect(loadBalancerReducer(paused, { type: "tick" })).toBe(paused);
  });

  it("速度とトラフィック量を操作可能な範囲に丸める", () => {
    const fast = loadBalancerReducer(initialLoadBalancerState, { type: "set-speed", speed: 10 });
    const lowTraffic = loadBalancerReducer(fast, { type: "set-traffic", traffic: -2 });
    expect(lowTraffic.speed).toBe(2);
    expect(lowTraffic.traffic).toBe(1);
  });

  it("Reset で再生設定、障害、統計を合成した初期状態へ戻す", () => {
    const changed: LoadBalancerState = {
      ...initialLoadBalancerState,
      playback: "running",
      speed: 2,
      completedRequests: 8,
      rejectedRequests: 3,
      servers: { ...initialLoadBalancerState.servers, "server-a": "down" },
    };
    expect(loadBalancerReducer(changed, { type: "reset" })).toEqual(initialLoadBalancerState);
  });
});

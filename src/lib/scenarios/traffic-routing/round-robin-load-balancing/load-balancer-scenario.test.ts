import { describe, expect, it } from "vitest";
import {
  createInitialLoadBalancerState,
  getScore,
  initialLoadBalancerState,
  loadBalancerReducer,
  REQUEST_GOAL,
  type LoadBalancerState,
  type ServerId,
} from "./load-balancer-scenario";

function start(state: LoadBalancerState = initialLoadBalancerState) {
  return loadBalancerReducer(state, { type: "start" });
}

function deal(state: LoadBalancerState, serverId: ServerId) {
  return loadBalancerReducer(state, { type: "deal", serverId });
}

describe("ラウンドロビン・ディーラー", () => {
  it("Healthy な Server へ順番に配送して目標件数で勝利する", () => {
    let state = start({ ...initialLoadBalancerState, traffic: 5 });
    const order: ServerId[] = ["server-a", "server-b", "server-c"];
    for (let index = 0; index < REQUEST_GOAL; index += 1) {
      if (state.pendingRequests === 0) state = loadBalancerReducer(state, { type: "tick" });
      state = deal(state, order[index % order.length]);
    }

    expect(state.outcome).toBe("won");
    expect(state.correctDecisions).toBe(REQUEST_GOAL);
    expect(state.deliveredByServer).toEqual({ "server-a": 4, "server-b": 4, "server-c": 4 });
    expect(getScore(state)).toEqual({ accuracy: 100, fairness: 100, availability: 100, total: 100 });
  });

  it("Down Server を選ぶと配送に失敗する", () => {
    const failed = loadBalancerReducer(initialLoadBalancerState, { type: "fail", serverId: "server-a" });
    const state = deal(start(failed), "server-a");

    expect(state.outcome).toBe("lost");
    expect(state.rejectedRequests).toBe(1);
    expect(state.feedback.title).toContain("Down Server");
  });

  it("Healthy でも次の順番を飛ばすと偏り超過で失敗する", () => {
    const state = deal(start(), "server-b");
    expect(state.outcome).toBe("lost");
    expect(state.feedback.detail).toContain("server-a");
    expect(getScore(state).fairness).toBe(0);
  });

  it("停止した Server を循環から除外し、復旧後に再参加させる", () => {
    let state = loadBalancerReducer(initialLoadBalancerState, { type: "fail", serverId: "server-b" });
    state = start(state);
    state = deal(state, "server-a");
    state = deal(state, "server-c");
    state = loadBalancerReducer(state, { type: "recover", serverId: "server-b" });
    state = loadBalancerReducer(state, { type: "tick" });
    state = deal(state, "server-a");
    state = deal(state, "server-b");

    expect(state.outcome).toBe("playing");
    expect(state.deliveredByServer).toEqual({ "server-a": 2, "server-b": 1, "server-c": 1 });
    expect(getScore(state).fairness).toBe(100);
  });

  it("全 Server 停止中は配送できず、復旧すれば再開できる", () => {
    let state = createInitialLoadBalancerState("challenge");
    for (const serverId of ["server-a", "server-b", "server-c"] as const) {
      state = loadBalancerReducer(state, { type: "fail", serverId });
    }
    const blocked = deal(start(state), "server-a");
    expect(blocked.outcome).toBe("lost");

    state = loadBalancerReducer(state, { type: "recover", serverId: "server-c" });
    state = deal(start(state), "server-c");
    expect(state.correctDecisions).toBe(1);
  });

  it("Pause 中の tick と配送では状態を変更しない", () => {
    const paused = { ...start(), playback: "paused" as const };
    expect(loadBalancerReducer(paused, { type: "tick" })).toBe(paused);
    expect(deal(paused, "server-a")).toBe(paused);
  });

  it("速度と Traffic を操作可能な境界へ丸める", () => {
    const fast = loadBalancerReducer(initialLoadBalancerState, { type: "set-speed", speed: 10 });
    const lowTraffic = loadBalancerReducer(fast, { type: "set-traffic", traffic: -2 });
    expect(lowTraffic.speed).toBe(2);
    expect(lowTraffic.traffic).toBe(1);
  });

  it("Reset で選択モードを保ち、固定の合成初期状態へ戻す", () => {
    const changed = deal(start(createInitialLoadBalancerState("challenge")), "server-a");
    expect(loadBalancerReducer(changed, { type: "reset" })).toEqual(createInitialLoadBalancerState("challenge"));
  });
});

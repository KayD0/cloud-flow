import { describe, expect, it } from "vitest";
import {
  advanceLoadBalancerScene,
  createInitialLoadBalancerState,
  getActiveServer,
  getScenePhase,
} from "./load-balancer-scenario";

function advance(times: number) {
  let state = createInitialLoadBalancerState();
  for (let index = 0; index < times; index += 1) {
    state = advanceLoadBalancerScene(state);
  }
  return state;
}

describe("ラウンドロビン・ディーラーの自動再生", () => {
  it("Request を A → B → C の順に配り、各 Server の負荷と応答数を更新する", () => {
    const processingA = advance(2);
    expect(getScenePhase(processingA)).toBe("processing");
    expect(processingA.servers[0].load).toBe("処理中");

    const arrivalB = advance(4);
    expect(getScenePhase(arrivalB)).toBe("arrival");
    expect(getActiveServer(arrivalB).id).toBe("server-b");
    expect(arrivalB.servers[0]).toMatchObject({ handled: 1, load: "待機" });

    const arrivalC = advance(8);
    expect(getActiveServer(arrivalC).id).toBe("server-c");
    expect(arrivalC.servers.map((server) => server.handled)).toEqual([1, 1, 0]);
  });

  it("C の Response 後に A へ戻り、周回数を更新してループする", () => {
    const loopBoundary = advance(12);

    expect(getScenePhase(loopBoundary)).toBe("arrival");
    expect(getActiveServer(loopBoundary).id).toBe("server-a");
    expect(loopBoundary.cycle).toBe(2);
    expect(loopBoundary.requestNumber).toBe(4);
    expect(loopBoundary.servers.map((server) => server.handled)).toEqual([1, 1, 1]);
    expect(loopBoundary.servers.every((server) => server.load === "待機")).toBe(true);
  });

  it("初期状態を毎回独立して生成する", () => {
    const first = createInitialLoadBalancerState();
    const second = createInitialLoadBalancerState();

    expect(first).toEqual(second);
    expect(first.servers).not.toBe(second.servers);
  });
});

import { describe, expect, it } from "vitest";
import { DNS_SCENE_DURATION_MS, getDnsSceneState } from "./dns-resolution-and-failover-scenario";

describe("DNS Resolution and Failover の自動再生シーン", () => {
  it("名前解決から Primary 接続、障害検知、Secondary 切替へ順番に進む", () => {
    expect(getDnsSceneState(0)).toMatchObject({ phase: "resolving", route: "resolver" });
    expect(getDnsSceneState(2_400)).toMatchObject({ phase: "primary-connected", route: "primary", primaryStatus: "healthy" });
    expect(getDnsSceneState(4_800)).toMatchObject({ phase: "failure-detected", route: "health-check", primaryStatus: "down", resolverAnswer: "primary" });
    expect(getDnsSceneState(7_200)).toMatchObject({ phase: "failing-over", route: "secondary", resolverAnswer: "secondary" });
    expect(getDnsSceneState(9_600)).toMatchObject({ phase: "secondary-connected", route: "secondary", secondaryStatus: "active" });
  });

  it("シーン終端の次の瞬間に初期状態へ戻る", () => {
    expect(getDnsSceneState(DNS_SCENE_DURATION_MS - 1).phase).toBe("secondary-connected");
    expect(getDnsSceneState(DNS_SCENE_DURATION_MS)).toEqual(getDnsSceneState(0));
    expect(getDnsSceneState(DNS_SCENE_DURATION_MS * 2 + 2_400).phase).toBe("primary-connected");
  });
});

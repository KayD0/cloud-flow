import { describe, expect, it } from "vitest";
import {
  DNS_TTL_SECONDS,
  MAX_FAILED_CONNECTIONS,
  dnsScenarioReducer,
  getChallengeScore,
  getGuidedNextAction,
  initialDnsScenarioState,
  type DnsScenarioAction,
  type DnsScenarioState,
} from "./dns-resolution-and-failover-scenario";

function run(actions: DnsScenarioAction[], state = initialDnsScenarioState) {
  return actions.reduce<DnsScenarioState>(dnsScenarioReducer, state);
}

const start: DnsScenarioAction = { type: "start", mode: "challenge" };

describe("DNSレスキュー", () => {
  it("正常な Primary へ接続できる", () => {
    const state = run([start, { type: "connect" }]);
    expect(state.feedback.title).toContain("通常通信に成功");
    expect(state.outcome).toBe("playing");
  });

  it("Failover と TTL 満了後の再解決で Secondary へ復旧する", () => {
    const state = run([
      start,
      { type: "inject-failure" },
      { type: "failover" },
      { type: "advance-ttl" },
      { type: "advance-ttl" },
      { type: "advance-ttl" },
      { type: "connect" },
    ]);
    expect(state.outcome).toBe("won");
    expect(state.cachedRecord).toBe("secondary");
    expect(state.ttlRemaining).toBe(DNS_TTL_SECONDS);
    expect(getChallengeScore(state).total).toBeGreaterThanOrEqual(80);
  });

  it("権威レコードだけ切り替えても TTL 中は古い Primary への接続に失敗する", () => {
    const state = run([start, { type: "inject-failure" }, { type: "failover" }, { type: "connect" }]);
    expect(state.outcome).toBe("playing");
    expect(state.failedConnections).toBe(1);
    expect(state.feedback.detail).toContain("TTL");
  });

  it("到達不能 Endpoint を選び続けると失敗する", () => {
    const attempts = Array.from({ length: MAX_FAILED_CONNECTIONS }, () => ({ type: "connect" as const }));
    const state = run([start, { type: "inject-failure" }, ...attempts]);
    expect(state.outcome).toBe("lost");
    expect(state.playback).toBe("paused");
    expect(getChallengeScore(state).accuracy).toBe(0);
  });

  it("TTL は 0 未満にならず、空キャッシュの進行は無視する", () => {
    const expired = run([start, { type: "advance-ttl" }, { type: "advance-ttl" }, { type: "advance-ttl" }]);
    const unchanged = dnsScenarioReducer(expired, { type: "advance-ttl" });
    expect(expired.ttlRemaining).toBe(0);
    expect(unchanged).toBe(expired);
  });

  it("Guided の次操作を因果順に提示し、Reset は固定初期状態へ戻す", () => {
    let state = dnsScenarioReducer(initialDnsScenarioState, { type: "start", mode: "guided" });
    expect(getGuidedNextAction(state)).toBe("inject-failure");
    state = dnsScenarioReducer(state, { type: "inject-failure" });
    expect(getGuidedNextAction(state)).toBe("failover");
    state = dnsScenarioReducer(state, { type: "failover" });
    expect(getGuidedNextAction(state)).toBe("advance-ttl");
    expect(dnsScenarioReducer(state, { type: "reset" })).toEqual(initialDnsScenarioState);
  });
});

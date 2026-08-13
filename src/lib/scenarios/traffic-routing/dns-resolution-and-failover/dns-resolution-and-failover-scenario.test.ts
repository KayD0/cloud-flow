import { describe, expect, it } from "vitest";
import { dnsScenarioReducer, initialDnsScenarioState, type DnsScenarioState } from "./dns-resolution-and-failover-scenario";

function runQuery(state: DnsScenarioState) {
  let next = dnsScenarioReducer(state, { type: "start" });
  for (let step = 0; step < 4; step += 1) next = dnsScenarioReducer(next, { type: "tick" });
  return next;
}

describe("dnsScenarioReducer", () => {
  it("正常時はキャッシュされた Primary へ到達する", () => {
    const state = runQuery(initialDnsScenarioState);
    expect(state.phase).toBe("primary-success");
    expect(state.cachedRecord).toBe("primary");
    expect(state.completedQueries).toBe(1);
  });

  it("Primary 障害後も TTL が残る間は古い Primary を参照する", () => {
    const state = dnsScenarioReducer(initialDnsScenarioState, { type: "fail-primary" });
    expect(state.phase).toBe("stale-cache-failure");
    expect(state.cachedRecord).toBe("primary");
    expect(state.ttlRemaining).toBeGreaterThan(0);
  });

  it("レコード変更だけでは Resolver の既存キャッシュを書き換えない", () => {
    const state = dnsScenarioReducer(initialDnsScenarioState, { type: "switch-record" });
    expect(state.authoritativeRecord).toBe("secondary");
    expect(state.cachedRecord).toBe("primary");
  });

  it("TTL 満了後の再問い合わせで Secondary へ切り替える", () => {
    const failed = dnsScenarioReducer(initialDnsScenarioState, { type: "fail-primary" });
    const switched = dnsScenarioReducer(failed, { type: "switch-record" });
    const expired = dnsScenarioReducer(switched, { type: "expire-ttl" });
    const state = runQuery(expired);
    expect(state.phase).toBe("secondary-success");
    expect(state.cachedRecord).toBe("secondary");
  });

  it("TTL 満了だけでは障害中の Primary レコードから切り替わらない", () => {
    const failed = dnsScenarioReducer(initialDnsScenarioState, { type: "fail-primary" });
    const expired = dnsScenarioReducer(failed, { type: "expire-ttl" });
    expect(runQuery(expired).phase).toBe("stale-cache-failure");
  });

  it("Pause 中の tick は状態を変更せず、Reset は合成した初期状態へ戻す", () => {
    const paused = { ...initialDnsScenarioState, playback: "paused" as const };
    expect(dnsScenarioReducer(paused, { type: "tick" })).toBe(paused);
    const changed = dnsScenarioReducer(initialDnsScenarioState, { type: "fail-primary" });
    expect(dnsScenarioReducer(changed, { type: "reset" })).toEqual(initialDnsScenarioState);
  });
});

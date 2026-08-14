import { describe, expect, it } from "vitest";
import {
  backoffMs,
  initialTimeoutAndBoundedRetryState,
  timeoutAndBoundedRetryReducer,
  type TimeoutAndBoundedRetryState,
} from "./timeout-and-bounded-retry-scenario";

function runToCompletion(state: TimeoutAndBoundedRetryState) {
  let current = timeoutAndBoundedRetryReducer(state, { type: "start" });
  for (let count = 0; count < 30 && current.playback !== "completed"; count += 1) {
    current = timeoutAndBoundedRetryReducer(current, { type: "tick" });
  }
  return current;
}

describe("timeoutAndBoundedRetryReducer", () => {
  it("Timeout、Backoff、Retryを経て3回目に成功する", () => {
    const firstTimeout = timeoutAndBoundedRetryReducer(
      { ...initialTimeoutAndBoundedRetryState, playback: "running" },
      { type: "tick" },
    );
    expect(firstTimeout.phase).toBe("timeout");
    expect(runToCompletion(initialTimeoutAndBoundedRetryState)).toMatchObject({ playback: "completed", phase: "success", attempt: 3 });
  });

  it("最大試行回数に達するとRetry判断後に打ち切る", () => {
    const completed = runToCompletion({ ...initialTimeoutAndBoundedRetryState, serviceDelayMs: 2_000, timeoutMs: 300, maxAttempts: 2 });
    expect(completed).toMatchObject({ playback: "completed", phase: "give-up", attempt: 2 });
  });

  it("遅延がTimeout以下なら最初のRequestで成功する", () => {
    const completed = runToCompletion({ ...initialTimeoutAndBoundedRetryState, serviceDelayMs: 600, timeoutMs: 800 });
    expect(completed).toMatchObject({ phase: "success", attempt: 1 });
  });

  it("指数Backoffを説明用の決定値として返す", () => {
    expect([backoffMs(1), backoffMs(2), backoffMs(3)]).toEqual([300, 600, 1_200]);
  });

  it("Pause中のtickと実行中の設定変更は状態を変えない", () => {
    const paused = { ...initialTimeoutAndBoundedRetryState, playback: "paused" as const };
    expect(timeoutAndBoundedRetryReducer(paused, { type: "tick" })).toBe(paused);
    const running = { ...initialTimeoutAndBoundedRetryState, playback: "running" as const };
    expect(timeoutAndBoundedRetryReducer(running, { type: "set-timeout", value: 1_500 })).toBe(running);
  });

  it("設定値を範囲内へ丸め、Resetで合成した初期状態へ戻す", () => {
    let changed = timeoutAndBoundedRetryReducer(initialTimeoutAndBoundedRetryState, { type: "set-service-delay", value: 1_551 });
    changed = timeoutAndBoundedRetryReducer(changed, { type: "set-timeout", value: 99 });
    changed = timeoutAndBoundedRetryReducer(changed, { type: "set-max-attempts", value: 9 });
    expect(changed).toMatchObject({ serviceDelayMs: 1_600, timeoutMs: 300, maxAttempts: 5 });
    expect(timeoutAndBoundedRetryReducer(changed, { type: "reset" })).toEqual(initialTimeoutAndBoundedRetryState);
  });
});

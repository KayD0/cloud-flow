import { describe, expect, it } from "vitest";
import { initialRetryDeadLetterState, retryDeadLetterReducer, type RetryDeadLetterAction, type RetryDeadLetterState } from "./retry-and-dead-letter-queue-scenario";
function reduce(state: RetryDeadLetterState, actions: RetryDeadLetterAction[]) { return actions.reduce(retryDeadLetterReducer, state); }

describe("retryDeadLetterReducer", () => {
  it("正常系ではQueueからConsumerを経てDeliveredになる", () => {
    const state = reduce(initialRetryDeadLetterState, [{ type: "start" }, { type: "tick" }, { type: "tick" }]);
    expect(state).toMatchObject({ playback: "completed", stage: "delivered", deliveryCount: 1, dlqCount: 0 });
  });
  it("失敗後に指定回数だけ待機と再配送を行いDLQへ移動する", () => {
    const state = reduce(initialRetryDeadLetterState, [{ type: "set-failure", enabled: true }, { type: "start" }, { type: "tick" }, { type: "tick" }, { type: "tick" }, { type: "tick" }, { type: "tick" }, { type: "tick" }]);
    expect(state).toMatchObject({ playback: "completed", stage: "dlq", retryCount: 2, dlqCount: 1 });
  });
  it("Retry上限0では最初の失敗でDLQへ移動する", () => {
    const configured = reduce(initialRetryDeadLetterState, [{ type: "set-retry-limit", retryLimit: 0 }, { type: "set-failure", enabled: true }, { type: "start" }]);
    expect(reduce(configured, [{ type: "tick" }, { type: "tick" }])).toMatchObject({ stage: "dlq", retryCount: 0, dlqCount: 1 });
  });
  it("Pause中のtickでは状態を変更しない", () => {
    const paused = reduce(initialRetryDeadLetterState, [{ type: "start" }, { type: "tick" }, { type: "pause" }]);
    expect(retryDeadLetterReducer(paused, { type: "tick" })).toBe(paused);
  });
  it("DLQ再処理はQueueへ戻し、失敗注入とRetry回数を初期化する", () => {
    const dlq = { ...initialRetryDeadLetterState, playback: "completed" as const, stage: "dlq" as const, retryCount: 2, failureInjected: true, dlqCount: 1 };
    expect(retryDeadLetterReducer(dlq, { type: "reprocess-dlq" })).toMatchObject({ playback: "idle", stage: "queued", retryCount: 0, failureInjected: false, dlqCount: 1 });
  });
  it("Resetで合成した初期状態へ戻す", () => {
    const changed = { ...initialRetryDeadLetterState, playback: "completed" as const, stage: "delivered" as const, deliveryCount: 1 };
    expect(retryDeadLetterReducer(changed, { type: "reset" })).toEqual(initialRetryDeadLetterState);
  });
});

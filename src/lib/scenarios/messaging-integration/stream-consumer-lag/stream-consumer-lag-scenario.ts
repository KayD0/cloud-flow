export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type ConsumerId = "a" | "b";

export interface StreamConsumerLagState {
  playback: PlaybackState;
  tick: number;
  streamOffset: number;
  cursorA: number;
  cursorB: number;
  publishRate: number;
  consumerRateA: number;
  consumerRateB: number;
  consumerAActive: boolean;
  consumerBActive: boolean;
}

export type StreamConsumerLagAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" }
  | { type: "set-publish-rate"; rate: number }
  | { type: "set-consumer-rate"; consumer: ConsumerId; rate: number }
  | { type: "set-consumer-active"; consumer: ConsumerId; active: boolean };

export const initialStreamConsumerLagState: StreamConsumerLagState = {
  playback: "idle", tick: 0, streamOffset: 24, cursorA: 18, cursorB: 12,
  publishRate: 6, consumerRateA: 8, consumerRateB: 4,
  consumerAActive: true, consumerBActive: true,
};

const clampRate = (rate: number) => Math.max(0, Math.min(12, Math.round(rate)));

export function getConsumerLag(state: StreamConsumerLagState, consumer: ConsumerId): number {
  return state.streamOffset - (consumer === "a" ? state.cursorA : state.cursorB);
}

export function streamConsumerLagReducer(state: StreamConsumerLagState, action: StreamConsumerLagAction): StreamConsumerLagState {
  switch (action.type) {
    case "start": return state.playback === "completed" ? { ...state, playback: "running", tick: 0 } : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialStreamConsumerLagState;
    case "set-publish-rate": return { ...state, publishRate: clampRate(action.rate) };
    case "set-consumer-rate": return action.consumer === "a" ? { ...state, consumerRateA: clampRate(action.rate) } : { ...state, consumerRateB: clampRate(action.rate) };
    case "set-consumer-active": return action.consumer === "a" ? { ...state, consumerAActive: action.active } : { ...state, consumerBActive: action.active };
    case "tick": {
      if (state.playback !== "running") return state;
      const streamOffset = state.streamOffset + state.publishRate;
      const cursorA = state.consumerAActive ? Math.min(streamOffset, state.cursorA + state.consumerRateA) : state.cursorA;
      const cursorB = state.consumerBActive ? Math.min(streamOffset, state.cursorB + state.consumerRateB) : state.cursorB;
      const tick = state.tick + 1;
      return { ...state, streamOffset, cursorA, cursorB, tick, playback: tick >= 12 ? "completed" : "running" };
    }
  }
}

export function getStateExplanation(state: StreamConsumerLagState): string {
  if (state.playback === "idle") return "合成 Stream の初期状態です。Start すると Producer の追記と各 Consumer の読み取りが始まります。";
  if (state.playback === "paused") return "シナリオを一時停止しています。現在の cursor と Lag を保ったまま再開できます。";
  if (state.playback === "completed") return "12 ステップの観察が完了しました。設定を変えて Start するか、Reset で初期状態へ戻せます。";
  if (!state.consumerAActive || !state.consumerBActive) return "停止中の Consumer は cursor が動かず、Producer が追記するたびに Lag が増えます。";
  const lagAChange = state.publishRate - state.consumerRateA;
  const lagBChange = state.publishRate - state.consumerRateB;
  if (lagAChange <= 0 && lagBChange <= 0) return "両 Consumer の処理量が発行量以上なので、蓄積した Lag は縮小します。";
  if (lagAChange > 0 && lagBChange > 0) return "発行量が両 Consumer の処理量を上回り、どちらの Lag も増加します。";
  return `Consumer ${lagAChange > 0 ? "A" : "B"} は処理量が発行量に追いつかず、Lag が増加します。`;
}

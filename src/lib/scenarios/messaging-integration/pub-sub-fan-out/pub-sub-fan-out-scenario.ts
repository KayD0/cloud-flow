export const SUBSCRIBER_IDS = ["a", "b", "c"] as const;

export type SubscriberId = (typeof SUBSCRIBER_IDS)[number];
export type PlaybackState = "idle" | "published" | "running" | "paused" | "completed";
export type DeliveryState = "waiting" | "in-transit" | "delivered" | "subscription-disabled" | "subscriber-stopped";

export const FAN_OUT_STAGES = [
  { id: "ready", label: "Ready", detail: "合成メッセージは Publisher で待機しています。Publish すると Topic に1回だけ送信されます。" },
  { id: "topic", label: "Published to Topic", detail: "Topic が合成メッセージを受け付けました。Start すると有効な購読へ fan-out します。" },
  { id: "fan-out", label: "Fan-out", detail: "Topic が各購読の状態を評価し、配送可能な Subscriber へ同じメッセージを分岐しています。" },
  { id: "complete", label: "Delivery complete", detail: "有効で稼働中の Subscriber への配送が完了しました。各行で配送結果を確認できます。" },
] as const;

export interface SubscriberState {
  subscriptionEnabled: boolean;
  stopped: boolean;
  delivery: DeliveryState;
}

export interface PubSubFanOutState {
  playback: PlaybackState;
  stageIndex: number;
  messageId: number;
  subscribers: Record<SubscriberId, SubscriberState>;
}

export type PubSubFanOutAction =
  | { type: "publish" }
  | { type: "start" }
  | { type: "pause" }
  | { type: "tick" }
  | { type: "reset" }
  | { type: "set-subscription"; subscriberId: SubscriberId; enabled: boolean }
  | { type: "set-stopped"; subscriberId: SubscriberId; stopped: boolean };

function createSubscribers(): Record<SubscriberId, SubscriberState> {
  return {
    a: { subscriptionEnabled: true, stopped: false, delivery: "waiting" },
    b: { subscriptionEnabled: true, stopped: false, delivery: "waiting" },
    c: { subscriptionEnabled: true, stopped: false, delivery: "waiting" },
  };
}

export const initialPubSubFanOutState: PubSubFanOutState = {
  playback: "idle",
  stageIndex: 0,
  messageId: 1042,
  subscribers: createSubscribers(),
};

function deliveryFor(subscriber: SubscriberState, delivered: boolean): DeliveryState {
  if (!subscriber.subscriptionEnabled) return "subscription-disabled";
  if (subscriber.stopped) return "subscriber-stopped";
  return delivered ? "delivered" : "in-transit";
}

function advance(state: PubSubFanOutState): PubSubFanOutState {
  if (state.playback !== "running") return state;
  const stageIndex = Math.min(state.stageIndex + 1, FAN_OUT_STAGES.length - 1);
  const completed = stageIndex === FAN_OUT_STAGES.length - 1;
  return {
    ...state,
    stageIndex,
    playback: completed ? "completed" : "running",
    subscribers: Object.fromEntries(
      SUBSCRIBER_IDS.map((id) => [id, { ...state.subscribers[id], delivery: deliveryFor(state.subscribers[id], completed) }]),
    ) as Record<SubscriberId, SubscriberState>,
  };
}

export function pubSubFanOutReducer(state: PubSubFanOutState, action: PubSubFanOutAction): PubSubFanOutState {
  switch (action.type) {
    case "publish":
      return state.playback === "idle" ? { ...state, playback: "published", stageIndex: 1 } : state;
    case "start":
      return state.playback === "published" || state.playback === "paused" ? { ...state, playback: "running" } : state;
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "tick":
      return advance(state);
    case "reset":
      return initialPubSubFanOutState;
    case "set-subscription": {
      if (state.playback === "running" || state.playback === "completed") return state;
      const subscriber = state.subscribers[action.subscriberId];
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.subscriberId]: { ...subscriber, subscriptionEnabled: action.enabled, delivery: "waiting" },
        },
      };
    }
    case "set-stopped": {
      if (state.playback === "running" || state.playback === "completed") return state;
      const subscriber = state.subscribers[action.subscriberId];
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.subscriberId]: { ...subscriber, stopped: action.stopped, delivery: "waiting" },
        },
      };
    }
  }
}

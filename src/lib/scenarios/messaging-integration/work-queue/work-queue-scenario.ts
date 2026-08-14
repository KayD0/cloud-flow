export type WorkQueuePlayback = "idle" | "running" | "paused" | "completed";
export type ConsumerId = "a" | "b";
export interface WorkQueueState { playback: WorkQueuePlayback; publicationVolume: number; processingAmount: number; published: number; queued: number; processed: Record<ConsumerId, number>; consumers: Record<ConsumerId, boolean>; nextConsumer: ConsumerId; tickCount: number; }
export type WorkQueueAction = { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" } | { type: "set-publication-volume"; value: number } | { type: "set-processing-amount"; value: number } | { type: "toggle-consumer"; consumer: ConsumerId };
export const initialWorkQueueState: WorkQueueState = { playback: "idle", publicationVolume: 18, processingAmount: 2, published: 0, queued: 0, processed: { a: 0, b: 0 }, consumers: { a: true, b: true }, nextConsumer: "a", tickCount: 0 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));
function advance(state: WorkQueueState): WorkQueueState {
  if (state.playback !== "running") return state;
  const batch = Math.min(4, state.publicationVolume - state.published); const published = state.published + batch; let queued = state.queued + batch;
  const processed = { ...state.processed }; let nextConsumer = state.nextConsumer;
  const available = (["a", "b"] as const).filter((id) => state.consumers[id]);
  const capacity: Partial<Record<ConsumerId, number>> = Object.fromEntries(available.map((id) => [id, state.processingAmount]));
  while (queued > 0 && available.some((id) => (capacity[id] ?? 0) > 0)) {
    const consumer = available.find((id) => id === nextConsumer && (capacity[id] ?? 0) > 0) ?? available.find((id) => (capacity[id] ?? 0) > 0); if (!consumer) break;
    queued -= 1; processed[consumer] += 1; capacity[consumer] = (capacity[consumer] ?? 0) - 1; nextConsumer = consumer === "a" ? "b" : "a";
  }
  return { ...state, playback: published >= state.publicationVolume && queued === 0 ? "completed" : "running", published, queued, processed, nextConsumer, tickCount: state.tickCount + 1 };
}
export function workQueueReducer(state: WorkQueueState, action: WorkQueueAction): WorkQueueState {
  switch (action.type) {
    case "start": return state.playback === "completed" || state.playback === "running" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialWorkQueueState;
    case "tick": return advance(state);
    case "set-publication-volume": return state.playback === "idle" ? { ...state, publicationVolume: clamp(action.value, 8, 40) } : state;
    case "set-processing-amount": return { ...state, processingAmount: clamp(action.value, 1, 4) };
    case "toggle-consumer": return { ...state, consumers: { ...state.consumers, [action.consumer]: !state.consumers[action.consumer] } };
  }
}

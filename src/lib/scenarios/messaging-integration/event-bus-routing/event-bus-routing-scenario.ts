export const EVENT_TYPES = ["order.created", "customer.updated"] as const;
export const PRIORITIES = ["normal", "high"] as const;
export const REGIONS = ["east", "west"] as const;
export const RULE_IDS = ["order", "priority", "east"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventPriority = (typeof PRIORITIES)[number];
export type EventRegion = (typeof REGIONS)[number];
export type RuleId = (typeof RULE_IDS)[number];
export type ConsumerId = "order-processor" | "priority-monitor" | "east-analytics";
export type Playback = "idle" | "running" | "paused" | "completed";
export type Phase = "producer" | "bus" | "evaluation" | "delivery" | "unmatched" | "completed";

export interface EventAttributes { type: EventType; priority: EventPriority; region: EventRegion; }
export interface SyntheticEvent extends EventAttributes { id: number; }
export interface RuleResult { ruleId: RuleId; matched: boolean; reason: string; consumer: ConsumerId; }
export interface EventBusRoutingState {
  playback: Playback;
  phase: Phase;
  draft: EventAttributes;
  enabledRules: Record<RuleId, boolean>;
  queue: readonly SyntheticEvent[];
  activeEvent?: SyntheticEvent;
  evaluations: readonly RuleResult[];
  delivered: readonly ConsumerId[];
  processedCount: number;
  nextEventId: number;
}

export type EventBusRoutingAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "inject" }
  | { type: "set-attribute"; attribute: keyof EventAttributes; value: string }
  | { type: "toggle-rule"; ruleId: RuleId } | { type: "tick" };

const defaultEvent: SyntheticEvent = { id: 1, type: "order.created", priority: "high", region: "east" };
export const initialEventBusRoutingState: EventBusRoutingState = {
  playback: "idle", phase: "producer", draft: { type: "order.created", priority: "high", region: "east" },
  enabledRules: { order: true, priority: true, east: true }, queue: [defaultEvent], evaluations: [], delivered: [], processedCount: 0, nextEventId: 2,
};

export function evaluateEvent(event: SyntheticEvent, enabledRules: Record<RuleId, boolean>): RuleResult[] {
  return [
    { ruleId: "order", matched: enabledRules.order && event.type === "order.created", reason: enabledRules.order ? `type ${event.type} ${event.type === "order.created" ? "=" : "≠"} order.created` : "Rule is disabled", consumer: "order-processor" },
    { ruleId: "priority", matched: enabledRules.priority && event.priority === "high", reason: enabledRules.priority ? `priority ${event.priority} ${event.priority === "high" ? "=" : "≠"} high` : "Rule is disabled", consumer: "priority-monitor" },
    { ruleId: "east", matched: enabledRules.east && event.region === "east", reason: enabledRules.east ? `region ${event.region} ${event.region === "east" ? "=" : "≠"} east` : "Rule is disabled", consumer: "east-analytics" },
  ];
}

function tick(state: EventBusRoutingState): EventBusRoutingState {
  if (state.playback !== "running") return state;
  if (!state.activeEvent) {
    const [activeEvent, ...queue] = state.queue;
    return activeEvent ? { ...state, activeEvent, queue, phase: "producer", evaluations: [], delivered: [] } : { ...state, playback: "completed", phase: "completed" };
  }
  if (state.phase === "producer") return { ...state, phase: "bus" };
  if (state.phase === "bus") return { ...state, phase: "evaluation", evaluations: evaluateEvent(state.activeEvent, state.enabledRules) };
  if (state.phase === "evaluation") {
    const delivered = state.evaluations.filter((result) => result.matched).map((result) => result.consumer);
    return { ...state, phase: delivered.length ? "delivery" : "unmatched", delivered };
  }
  if (state.phase === "delivery" || state.phase === "unmatched") return { ...state, activeEvent: undefined, processedCount: state.processedCount + 1, phase: "producer" };
  return state;
}

export function eventBusRoutingReducer(state: EventBusRoutingState, action: EventBusRoutingAction): EventBusRoutingState {
  switch (action.type) {
    case "start": return state.playback === "running" || (state.queue.length === 0 && !state.activeEvent) ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialEventBusRoutingState;
    case "inject": {
      const event = { id: state.nextEventId, ...state.draft };
      return { ...state, queue: [...state.queue, event], nextEventId: state.nextEventId + 1, playback: state.playback === "completed" ? "idle" : state.playback, phase: state.playback === "completed" ? "producer" : state.phase };
    }
    case "set-attribute": return { ...state, draft: { ...state.draft, [action.attribute]: action.value } as EventAttributes };
    case "toggle-rule": return { ...state, enabledRules: { ...state.enabledRules, [action.ruleId]: !state.enabledRules[action.ruleId] } };
    case "tick": return tick(state);
  }
}

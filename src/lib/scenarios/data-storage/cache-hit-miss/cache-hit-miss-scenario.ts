export const CACHE_PRESETS = ["cold", "warm", "expired"] as const;
export type CachePreset = (typeof CACHE_PRESETS)[number];
export type CachePlayback = "idle" | "running" | "paused" | "completed";
export type CachePhase = "idle" | "application" | "cache-check" | "hit-response" | "miss" | "database" | "cache-update" | "response" | "completed";
export type RequestOutcome = "hit" | "miss";

export interface CacheHitMissState {
  playback: CachePlayback;
  phase: CachePhase;
  cachePreset: CachePreset;
  ttl: number;
  cacheAge: number;
  cacheHasValue: boolean;
  requestCount: number;
  activeRequest: number | null;
  completedRequests: number;
  hits: number;
  misses: number;
  databaseReads: number;
  cacheUpdates: number;
  currentOutcome: RequestOutcome | null;
}

export type CacheHitMissAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-cache"; cachePreset: CachePreset }
  | { type: "set-ttl"; ttl: number }
  | { type: "set-request-count"; requestCount: number }
  | { type: "tick" };

export const initialCacheHitMissState: CacheHitMissState = {
  playback: "idle",
  phase: "idle",
  cachePreset: "cold",
  ttl: 2,
  cacheAge: 0,
  cacheHasValue: false,
  requestCount: 3,
  activeRequest: null,
  completedRequests: 0,
  hits: 0,
  misses: 0,
  databaseReads: 0,
  cacheUpdates: 0,
  currentOutcome: null,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function presetCache(cachePreset: CachePreset, ttl: number) {
  if (cachePreset === "cold") return { cacheHasValue: false, cacheAge: 0 };
  if (cachePreset === "expired") return { cacheHasValue: true, cacheAge: ttl };
  return { cacheHasValue: true, cacheAge: 0 };
}

function tick(state: CacheHitMissState): CacheHitMissState {
  if (state.playback !== "running") return state;

  switch (state.phase) {
    case "application":
      return { ...state, phase: "cache-check" };
    case "cache-check": {
      const isHit = state.cacheHasValue && state.cacheAge < state.ttl;
      return isHit
        ? { ...state, phase: "hit-response", hits: state.hits + 1, currentOutcome: "hit" }
        : { ...state, phase: "miss", misses: state.misses + 1, currentOutcome: "miss" };
    }
    case "hit-response":
      return { ...state, phase: "response" };
    case "miss":
      return { ...state, phase: "database", databaseReads: state.databaseReads + 1 };
    case "database":
      return { ...state, phase: "cache-update" };
    case "cache-update":
      return { ...state, phase: "response", cacheHasValue: true, cacheAge: 0, cacheUpdates: state.cacheUpdates + 1 };
    case "response": {
      const completedRequests = state.completedRequests + 1;
      if (completedRequests >= state.requestCount) {
        return { ...state, playback: "completed", phase: "completed", completedRequests, activeRequest: null };
      }
      return {
        ...state,
        phase: "application",
        completedRequests,
        activeRequest: completedRequests + 1,
        cacheAge: state.cacheHasValue ? state.cacheAge + 1 : state.cacheAge,
        currentOutcome: null,
      };
    }
    default:
      return state;
  }
}

export function cacheHitMissReducer(state: CacheHitMissState, action: CacheHitMissAction): CacheHitMissState {
  switch (action.type) {
    case "start":
      if (state.playback === "completed") return state;
      return state.playback === "idle"
        ? { ...state, playback: "running", phase: "application", activeRequest: 1 }
        : { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialCacheHitMissState;
    case "set-cache":
      if (state.playback !== "idle") return state;
      return { ...state, cachePreset: action.cachePreset, ...presetCache(action.cachePreset, state.ttl) };
    case "set-ttl": {
      if (state.playback !== "idle") return state;
      const ttl = clamp(action.ttl, 1, 5);
      return { ...state, ttl, ...presetCache(state.cachePreset, ttl) };
    }
    case "set-request-count":
      if (state.playback !== "idle") return state;
      return { ...state, requestCount: clamp(action.requestCount, 1, 6) };
    case "tick":
      return tick(state);
  }
}

import type { InfrastructureNode, ScenarioControls } from "./model";

export const SERVER_IDS = ["server-a", "server-b", "server-c"] as const;
export type ServerId = (typeof SERVER_IDS)[number];

export interface RequestToken {
  id: number;
  target: ServerId;
  progress: number;
}

export interface LoadBalancerState extends ScenarioControls {
  servers: Record<ServerId, InfrastructureNode["status"]>;
  nextServerIndex: number;
  nextRequestId: number;
  requests: readonly RequestToken[];
  completedRequests: number;
}

export type LoadBalancerAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-speed"; speed: number }
  | { type: "set-traffic"; traffic: number }
  | { type: "fail"; serverId: ServerId }
  | { type: "recover"; serverId: ServerId }
  | { type: "tick" };

export const initialLoadBalancerState: LoadBalancerState = {
  playback: "idle",
  speed: 1,
  traffic: 2,
  servers: {
    "server-a": "healthy",
    "server-b": "healthy",
    "server-c": "healthy",
  },
  nextServerIndex: 0,
  nextRequestId: 1,
  requests: [],
  completedRequests: 0,
};

function chooseHealthyServer(
  state: LoadBalancerState,
): { serverId: ServerId; nextIndex: number } | undefined {
  for (let offset = 0; offset < SERVER_IDS.length; offset += 1) {
    const index = (state.nextServerIndex + offset) % SERVER_IDS.length;
    const serverId = SERVER_IDS[index];
    if (state.servers[serverId] !== "down") {
      return { serverId, nextIndex: (index + 1) % SERVER_IDS.length };
    }
  }
}

function tick(state: LoadBalancerState): LoadBalancerState {
  if (state.playback !== "running") return state;

  const advanced = state.requests
    .map((request) => ({ ...request, progress: request.progress + 0.2 * state.speed }))
    .filter((request) => request.progress < 1);
  const completed = state.requests.length - advanced.length;
  let nextIndex = state.nextServerIndex;
  let nextRequestId = state.nextRequestId;
  const created: RequestToken[] = [];

  for (let count = 0; count < state.traffic; count += 1) {
    const choice = chooseHealthyServer({ ...state, nextServerIndex: nextIndex });
    if (!choice) break;
    created.push({ id: nextRequestId, target: choice.serverId, progress: 0 });
    nextRequestId += 1;
    nextIndex = choice.nextIndex;
  }

  const activeTargets = new Set([...advanced, ...created].map((request) => request.target));
  const servers = { ...state.servers };
  for (const serverId of SERVER_IDS) {
    if (servers[serverId] !== "down") {
      servers[serverId] = activeTargets.has(serverId) ? "processing" : "healthy";
    }
  }

  return {
    ...state,
    servers,
    requests: [...advanced, ...created],
    nextServerIndex: nextIndex,
    nextRequestId,
    completedRequests: state.completedRequests + completed,
  };
}

export function loadBalancerReducer(
  state: LoadBalancerState,
  action: LoadBalancerAction,
): LoadBalancerState {
  switch (action.type) {
    case "start":
      return { ...state, playback: "running" };
    case "pause":
      return { ...state, playback: "paused" };
    case "reset":
      return initialLoadBalancerState;
    case "set-speed":
      return { ...state, speed: action.speed };
    case "set-traffic":
      return { ...state, traffic: action.traffic };
    case "fail":
      return {
        ...state,
        servers: { ...state.servers, [action.serverId]: "down" },
        requests: state.requests.filter((request) => request.target !== action.serverId),
      };
    case "recover":
      return {
        ...state,
        servers: { ...state.servers, [action.serverId]: "healthy" },
      };
    case "tick":
      return tick(state);
  }
}

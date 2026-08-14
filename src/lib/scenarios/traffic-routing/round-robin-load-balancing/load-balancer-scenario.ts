export const SERVER_IDS = ["server-a", "server-b", "server-c"] as const;

export type ServerId = (typeof SERVER_IDS)[number];
export type ScenePhase = "arrival" | "routing" | "processing" | "response";

export interface ServerState {
  id: ServerId;
  label: string;
  handled: number;
  load: "待機" | "処理中" | "応答済み";
}

export interface LoadBalancerState {
  cycle: number;
  requestNumber: number;
  targetIndex: number;
  phaseIndex: number;
  servers: readonly ServerState[];
}

export const SCENE_PHASES: readonly ScenePhase[] = [
  "arrival",
  "routing",
  "processing",
  "response",
];

const SERVER_LABELS = ["Server A", "Server B", "Server C"] as const;

export function createInitialLoadBalancerState(): LoadBalancerState {
  return {
    cycle: 1,
    requestNumber: 1,
    targetIndex: 0,
    phaseIndex: 0,
    servers: SERVER_IDS.map((id, index) => ({
      id,
      label: SERVER_LABELS[index],
      handled: 0,
      load: "待機" as const,
    })),
  };
}

export const initialLoadBalancerState = createInitialLoadBalancerState();

export function getActiveServer(state: LoadBalancerState): ServerState {
  return state.servers[state.targetIndex];
}

export function getScenePhase(state: LoadBalancerState): ScenePhase {
  return SCENE_PHASES[state.phaseIndex];
}

export function advanceLoadBalancerScene(state: LoadBalancerState): LoadBalancerState {
  const phase = getScenePhase(state);

  if (phase === "arrival") {
    return { ...state, phaseIndex: 1 };
  }

  if (phase === "routing") {
    return {
      ...state,
      phaseIndex: 2,
      servers: state.servers.map((server, index) => ({
        ...server,
        load: index === state.targetIndex ? "処理中" : "待機",
      })),
    };
  }

  if (phase === "processing") {
    return {
      ...state,
      phaseIndex: 3,
      servers: state.servers.map((server, index) =>
        index === state.targetIndex
          ? { ...server, handled: server.handled + 1, load: "応答済み" }
          : server,
      ),
    };
  }

  const nextTargetIndex = (state.targetIndex + 1) % SERVER_IDS.length;
  const wrapped = nextTargetIndex === 0;

  return {
    cycle: wrapped ? state.cycle + 1 : state.cycle,
    requestNumber: state.requestNumber + 1,
    targetIndex: nextTargetIndex,
    phaseIndex: 0,
    servers: state.servers.map((server) => ({ ...server, load: "待機" })),
  };
}

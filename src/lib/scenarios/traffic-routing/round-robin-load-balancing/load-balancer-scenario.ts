import type { InfrastructureNode, ScenarioControls } from "@/lib/infrastructure/model";

export const SERVER_IDS = ["server-a", "server-b", "server-c"] as const;
export type ServerId = (typeof SERVER_IDS)[number];
export type GameMode = "guided" | "challenge";
export type GameOutcome = "playing" | "won" | "lost";

export const REQUEST_GOAL = 12;

export interface RequestToken {
  id: number;
  target: ServerId;
  progress: number;
}

export interface GameFeedback {
  tone: "neutral" | "success" | "danger";
  title: string;
  detail: string;
}

export interface LoadBalancerState extends ScenarioControls {
  mode: GameMode;
  outcome: GameOutcome;
  servers: Record<ServerId, InfrastructureNode["status"]>;
  nextServerIndex: number;
  nextRequestId: number;
  requests: readonly RequestToken[];
  pendingRequests: number;
  deliveredByServer: Record<ServerId, number>;
  completedRequests: number;
  correctDecisions: number;
  totalDecisions: number;
  rejectedRequests: number;
  feedback: GameFeedback;
}

export type LoadBalancerAction =
  | { type: "select-mode"; mode: GameMode }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "set-speed"; speed: number }
  | { type: "set-traffic"; traffic: number }
  | { type: "fail"; serverId: ServerId }
  | { type: "recover"; serverId: ServerId }
  | { type: "deal"; serverId: ServerId }
  | { type: "tick" };

export function createInitialLoadBalancerState(mode: GameMode = "guided"): LoadBalancerState {
  return {
    playback: "idle",
    speed: 1,
    traffic: 2,
    mode,
    outcome: "playing",
    servers: {
      "server-a": "healthy",
      "server-b": "healthy",
      "server-c": "healthy",
    },
    nextServerIndex: 0,
    nextRequestId: 1,
    requests: [],
    pendingRequests: 0,
    deliveredByServer: { "server-a": 0, "server-b": 0, "server-c": 0 },
    completedRequests: 0,
    correctDecisions: 0,
    totalDecisions: 0,
    rejectedRequests: 0,
    feedback: {
      tone: "neutral",
      title: "配る準備ができています",
      detail: "Start を押し、到着順に次の Healthy な Server を選びます。",
    },
  };
}

export const initialLoadBalancerState = createInitialLoadBalancerState();

export function chooseHealthyServer(state: LoadBalancerState): ServerId | undefined {
  for (let offset = 0; offset < SERVER_IDS.length; offset += 1) {
    const index = (state.nextServerIndex + offset) % SERVER_IDS.length;
    const serverId = SERVER_IDS[index];
    if (state.servers[serverId] !== "down") return serverId;
  }
}

export function getScore(state: LoadBalancerState) {
  const accuracy = state.totalDecisions === 0
    ? 100
    : Math.round((state.correctDecisions / state.totalDecisions) * 100);
  const fairness = state.outcome === "lost" && state.rejectedRequests === 0 ? 0 : 100;
  const availability = state.rejectedRequests === 0 ? 100 : 0;
  return {
    accuracy,
    fairness,
    availability,
    total: Math.round((accuracy + fairness + availability) / 3),
  };
}

function deal(state: LoadBalancerState, serverId: ServerId): LoadBalancerState {
  if (state.playback !== "running" || state.outcome !== "playing" || state.pendingRequests === 0) {
    return state;
  }

  const expected = chooseHealthyServer(state);
  const totalDecisions = state.totalDecisions + 1;
  if (state.servers[serverId] === "down") {
    return {
      ...state,
      playback: "paused",
      outcome: "lost",
      totalDecisions,
      rejectedRequests: state.rejectedRequests + 1,
      feedback: {
        tone: "danger",
        title: "配送失敗: Down Server を選びました",
        detail: "Health check で Down と判定された宛先は候補から除外します。次の Healthy な Server へ飛ばすのが安全です。",
      },
    };
  }

  if (serverId !== expected) {
    return {
      ...state,
      playback: "paused",
      outcome: "lost",
      totalDecisions,
      feedback: {
        tone: "danger",
        title: "偏り超過: 順番を飛ばしました",
        detail: `次は ${expected ?? "Healthy な Server"} の番でした。同じ Healthy な宛先を飛ばすと、公平な循環が崩れます。`,
      },
    };
  }

  const correctDecisions = state.correctDecisions + 1;
  const won = correctDecisions >= REQUEST_GOAL;
  const index = SERVER_IDS.indexOf(serverId);
  return {
    ...state,
    playback: won ? "paused" : state.playback,
    outcome: won ? "won" : state.outcome,
    nextServerIndex: (index + 1) % SERVER_IDS.length,
    nextRequestId: state.nextRequestId + 1,
    requests: [...state.requests, { id: state.nextRequestId, target: serverId, progress: 0 }],
    pendingRequests: state.pendingRequests - 1,
    deliveredByServer: {
      ...state.deliveredByServer,
      [serverId]: state.deliveredByServer[serverId] + 1,
    },
    correctDecisions,
    totalDecisions,
    feedback: won
      ? {
          tone: "success",
          title: "目標達成: 公平に配送できました",
          detail: "Healthy な Server だけを循環させたため、安全性と公平性を両立できました。",
        }
      : {
          tone: "success",
          title: `Request #${state.nextRequestId} を正しく配送`,
          detail: "配送後のポインターを次へ進めることで、Healthy な Server 間の偏りを抑えます。",
        },
  };
}

function tick(state: LoadBalancerState): LoadBalancerState {
  if (state.playback !== "running" || state.outcome !== "playing") return state;

  const advanced = state.requests
    .map((request) => ({ ...request, progress: request.progress + 0.2 * state.speed }))
    .filter((request) => request.progress < 1);
  const completed = state.requests.length - advanced.length;
  const remainingGoal = REQUEST_GOAL - state.correctDecisions;
  const pendingRequests = state.pendingRequests === 0 && remainingGoal > 0
    ? Math.min(state.traffic, remainingGoal)
    : state.pendingRequests;

  return {
    ...state,
    requests: advanced,
    pendingRequests,
    completedRequests: state.completedRequests + completed,
  };
}

export function loadBalancerReducer(state: LoadBalancerState, action: LoadBalancerAction): LoadBalancerState {
  switch (action.type) {
    case "select-mode":
      return createInitialLoadBalancerState(action.mode);
    case "start": {
      if (state.outcome !== "playing") return state;
      const remainingGoal = REQUEST_GOAL - state.correctDecisions;
      return {
        ...state,
        playback: "running",
        pendingRequests: state.pendingRequests || Math.min(state.traffic, remainingGoal),
        feedback: {
          tone: "neutral",
          title: "Request が到着しました",
          detail: "次の Healthy な Server を選んで配送してください。",
        },
      };
    }
    case "pause":
      return { ...state, playback: "paused" };
    case "reset":
      return createInitialLoadBalancerState(state.mode);
    case "set-speed":
      return { ...state, speed: Math.min(2, Math.max(0.5, action.speed)) };
    case "set-traffic":
      return { ...state, traffic: Math.min(5, Math.max(1, Math.round(action.traffic))) };
    case "fail":
      return {
        ...state,
        servers: { ...state.servers, [action.serverId]: "down" },
        feedback: {
          tone: "neutral",
          title: `${action.serverId} を Down にしました`,
          detail: "Down Server は循環から除外し、次の Healthy な Server へ配送します。",
        },
      };
    case "recover":
      return {
        ...state,
        servers: { ...state.servers, [action.serverId]: "healthy" },
        feedback: {
          tone: "neutral",
          title: `${action.serverId} が復旧しました`,
          detail: "復旧した Server は、現在のポインターから始まる循環へ再参加します。",
        },
      };
    case "deal":
      return deal(state, action.serverId);
    case "tick":
      return tick(state);
  }
}

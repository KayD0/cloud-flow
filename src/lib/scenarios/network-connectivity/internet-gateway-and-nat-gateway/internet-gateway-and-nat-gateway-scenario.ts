export type CommunicationDirection = "ingress" | "egress";
export type GatewayId = "internetGateway" | "natGateway";
export type ScenarioPhase = "idle" | "running" | "paused" | "blocked" | "completed";

export interface GatewayScenarioState {
  direction: CommunicationDirection;
  phase: ScenarioPhase;
  step: number;
  internetGatewayEnabled: boolean;
  natGatewayEnabled: boolean;
}

export type GatewayScenarioAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-direction"; direction: CommunicationDirection }
  | { type: "set-gateway"; gateway: GatewayId; enabled: boolean };

export const initialGatewayScenarioState: GatewayScenarioState = {
  direction: "ingress",
  phase: "idle",
  step: 0,
  internetGatewayEnabled: true,
  natGatewayEnabled: true,
};

export const ROUTE_LABELS: Record<CommunicationDirection, readonly string[]> = {
  ingress: ["Internet", "Internet Gateway", "Public Resource"],
  egress: ["Private Resource", "NAT Gateway", "Internet Gateway", "Internet"],
};

function requiredGateway(direction: CommunicationDirection, nextStep: number): GatewayId | undefined {
  if (direction === "ingress" && nextStep === 1) return "internetGateway";
  if (direction === "egress" && nextStep === 1) return "natGateway";
  if (direction === "egress" && nextStep === 2) return "internetGateway";
}

function isEnabled(state: GatewayScenarioState, gateway: GatewayId) {
  return gateway === "internetGateway" ? state.internetGatewayEnabled : state.natGatewayEnabled;
}

export function getScenarioExplanation(state: GatewayScenarioState): string {
  const route = ROUTE_LABELS[state.direction];
  if (state.phase === "idle") {
    return state.direction === "ingress"
      ? "待機中: Public Resource は Internet Gateway を経由して外部から受信します。"
      : "待機中: Private Resource は NAT Gateway から Internet Gateway を経由して外部へ送信します。";
  }
  if (state.phase === "blocked") {
    const gateway = requiredGateway(state.direction, state.step + 1);
    return gateway === "natGateway"
      ? "停止: NAT Gateway が無効なため、Private Resource の Egress を中継できません。"
      : "停止: Internet Gateway が無効なため、Internet との通信境界を通過できません。";
  }
  if (state.phase === "completed") return `完了: ${route.join(" → ")} の合成通信が到達しました。`;
  if (state.phase === "paused") return `一時停止: ${route[state.step]} まで到達しています。`;
  return `通信中: ${route[state.step]} まで到達しています。`;
}

function tick(state: GatewayScenarioState): GatewayScenarioState {
  if (state.phase !== "running") return state;
  const route = ROUTE_LABELS[state.direction];
  const nextStep = state.step + 1;
  if (nextStep >= route.length) return { ...state, phase: "completed" };
  const gateway = requiredGateway(state.direction, nextStep);
  if (gateway && !isEnabled(state, gateway)) return { ...state, phase: "blocked" };
  return { ...state, step: nextStep, phase: nextStep === route.length - 1 ? "completed" : "running" };
}

export function gatewayScenarioReducer(state: GatewayScenarioState, action: GatewayScenarioAction): GatewayScenarioState {
  switch (action.type) {
    case "start":
      return state.phase === "completed" ? state : { ...state, phase: "running" };
    case "pause":
      return state.phase === "running" ? { ...state, phase: "paused" } : state;
    case "reset":
      return initialGatewayScenarioState;
    case "tick":
      return tick(state);
    case "set-direction":
      return { ...state, direction: action.direction, phase: "idle", step: 0 };
    case "set-gateway":
      return {
        ...state,
        [action.gateway === "internetGateway" ? "internetGatewayEnabled" : "natGatewayEnabled"]: action.enabled,
      };
  }
}

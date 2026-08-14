export type UnitType = "fighter" | "tank" | "marine" | "gunner";
export type NodeType = "air" | "ground" | "base";
export type PodStatus = "ready" | "destroyed" | "deploying";

export interface BattlePod {
  id: number;
  unit: UnitType;
  node: NodeType;
  status: PodStatus;
}

export interface BattleEvent { id: number; tone: "info" | "danger" | "success"; message: string; }
export interface KubernetesPodSchedulingState {
  pods: readonly BattlePod[];
  desiredReplicas: number;
  selfHealing: boolean;
  wave: number;
  nextPodId: number;
  nextEventId: number;
  events: readonly BattleEvent[];
}

export type KubernetesPodSchedulingAction =
  | { type: "enemy-wave"; victimId?: number }
  | { type: "toggle-self-healing" }
  | { type: "reconcile" }
  | { type: "complete-deployment" }
  | { type: "reset" };

export const unitMeta: Record<UnitType, { label: string; node: NodeType; cpu: number; memory: number }> = {
  fighter: { label: "戦闘機", node: "air", cpu: 18, memory: 12 },
  tank: { label: "戦車", node: "ground", cpu: 14, memory: 18 },
  marine: { label: "海兵隊", node: "ground", cpu: 8, memory: 10 },
  gunner: { label: "砲手", node: "base", cpu: 11, memory: 14 },
};

const initialPods: BattlePod[] = [
  { id: 1, unit: "fighter", node: "air", status: "ready" },
  { id: 2, unit: "fighter", node: "air", status: "ready" },
  { id: 3, unit: "tank", node: "ground", status: "ready" },
  { id: 4, unit: "tank", node: "ground", status: "ready" },
  { id: 5, unit: "tank", node: "ground", status: "ready" },
  { id: 6, unit: "tank", node: "ground", status: "ready" },
  { id: 7, unit: "gunner", node: "base", status: "ready" },
  { id: 8, unit: "gunner", node: "base", status: "ready" },
];

export const initialKubernetesPodSchedulingState: KubernetesPodSchedulingState = {
  pods: initialPods,
  desiredReplicas: 8,
  selfHealing: true,
  wave: 0,
  nextPodId: 9,
  nextEventId: 2,
  events: [{ id: 1, tone: "info", message: "Clusterは正常です。8/8 PodがReady。" }],
};

function appendEvent(state: KubernetesPodSchedulingState, tone: BattleEvent["tone"], message: string) {
  return [...state.events, { id: state.nextEventId, tone, message }].slice(-5);
}

function recover(state: KubernetesPodSchedulingState): KubernetesPodSchedulingState {
  const active = state.pods.filter((pod) => pod.status === "ready" || pod.status === "deploying");
  const missing = state.desiredReplicas - active.length;
  if (missing <= 0) return state;
  const destroyed = [...state.pods].reverse().find((pod) => pod.status === "destroyed");
  if (!destroyed) return state;
  const replacements = Array.from({ length: missing }, (_, index) => ({
    id: state.nextPodId + index,
    unit: destroyed.unit,
    node: unitMeta[destroyed.unit].node,
    status: "deploying" as const,
  }));
  return {
    ...state,
    pods: [...state.pods, ...replacements],
    nextPodId: state.nextPodId + missing,
    nextEventId: state.nextEventId + 1,
    events: appendEvent(state, "success", `ReplicaSetが不足を検知。${missing} Podを再作成しました。`),
  };
}

export function kubernetesPodSchedulingReducer(state: KubernetesPodSchedulingState, action: KubernetesPodSchedulingAction): KubernetesPodSchedulingState {
  switch (action.type) {
    case "enemy-wave": {
      const ready = state.pods.filter((pod) => pod.status === "ready");
      if (!ready.length) return state;
      const victim = ready.find((pod) => pod.id === action.victimId) ?? ready[0];
      const attacked: KubernetesPodSchedulingState = {
        ...state,
        wave: state.wave + 1,
        pods: state.pods.map((pod) => pod.id === victim.id ? { ...pod, status: "destroyed" as const } : pod),
        nextEventId: state.nextEventId + 1,
        events: appendEvent(state, "danger", `Wave ${state.wave + 1}: ${unitMeta[victim.unit].label} Pod #${victim.id}が大破。`),
      };
      return attacked;
    }
    case "toggle-self-healing": return {
      ...state,
      selfHealing: !state.selfHealing,
      nextEventId: state.nextEventId + 1,
      events: appendEvent(state, "info", `Self-Healingを${state.selfHealing ? "無効" : "有効"}にしました。`),
    };
    case "reconcile": return recover(state);
    case "complete-deployment": {
      if (!state.pods.some((pod) => pod.status === "deploying")) return state;
      return {
        ...state,
        pods: state.pods
          .filter((pod) => pod.status !== "destroyed")
          .map((pod) => pod.status === "deploying" ? { ...pod, status: "ready" as const } : pod),
        nextEventId: state.nextEventId + 1,
        events: appendEvent(state, "success", "新しいPodがNodeへ参加し、Readyになりました。"),
      };
    }
    case "reset": return initialKubernetesPodSchedulingState;
  }
}

export type PodPhase = "pending" | "scheduler" | "selected" | "starting" | "ready";
export type SchedulingPlayback = "idle" | "running" | "paused" | "completed" | "blocked";

export interface SchedulingPod { id: number; name: string; phase: PodPhase; }
export interface KubernetesPodSchedulingState {
  playback: SchedulingPlayback;
  nodeCapacity: number;
  pods: readonly SchedulingPod[];
  nextPodId: number;
  activePodId: number | null;
  decision: string;
}

export type KubernetesPodSchedulingAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" }
  | { type: "add-pod" } | { type: "set-capacity"; capacity: number }
  | { type: "reschedule"; podId: number };

export const initialKubernetesPodSchedulingState: KubernetesPodSchedulingState = {
  playback: "idle",
  nodeCapacity: 3,
  pods: [{ id: 1, name: "web-1", phase: "ready" }, { id: 2, name: "web-2", phase: "pending" }],
  nextPodId: 3,
  activePodId: null,
  decision: "web-2 は未配置です。Start すると Scheduler が Node の空き容量を確認します。",
};

const clampCapacity = (value: number) => Math.min(6, Math.max(1, Math.round(value)));
const occupiesNode = (phase: PodPhase) => phase === "selected" || phase === "starting" || phase === "ready";
const updatePod = (state: KubernetesPodSchedulingState, podId: number, phase: PodPhase) =>
  state.pods.map((pod) => pod.id === podId ? { ...pod, phase } : pod);

function tick(state: KubernetesPodSchedulingState): KubernetesPodSchedulingState {
  if (state.playback !== "running") return state;
  const active = state.pods.find((pod) => pod.id === state.activePodId);
  if (!active) {
    const pending = state.pods.find((pod) => pod.phase === "pending");
    if (!pending) return { ...state, playback: "completed", decision: "すべての Pod が Ready です。処理可能な完了状態になりました。" };
    return { ...state, activePodId: pending.id, pods: updatePod(state, pending.id, "scheduler"), decision: `${pending.name} を Scheduler の評価対象にしました。Node の使用量と容量を比較します。` };
  }
  if (active.phase === "scheduler") {
    const used = state.pods.filter((pod) => pod.id !== active.id && occupiesNode(pod.phase)).length;
    if (used >= state.nodeCapacity) return { ...state, playback: "blocked", decision: `${active.name} は配置できません。Node 使用量 ${used}/${state.nodeCapacity} で空き容量がありません。` };
    return { ...state, pods: updatePod(state, active.id, "selected"), decision: `${active.name} の配置先を Node A に決定しました。空き容量 ${state.nodeCapacity - used} が判断理由です。` };
  }
  if (active.phase === "selected") return { ...state, pods: updatePod(state, active.id, "starting"), decision: `${active.name} を Node A で Starting にしました。まだ処理は受け付けません。` };
  if (active.phase === "starting") {
    const pods = updatePod(state, active.id, "ready");
    const hasPending = pods.some((pod) => pod.phase === "pending");
    return { ...state, pods, activePodId: null, playback: hasPending ? "running" : "completed", decision: `${active.name} が Ready になり、処理可能になりました。` };
  }
  return { ...state, activePodId: null };
}

export function kubernetesPodSchedulingReducer(state: KubernetesPodSchedulingState, action: KubernetesPodSchedulingAction): KubernetesPodSchedulingState {
  switch (action.type) {
    case "start":
      if (state.playback === "running" || (state.playback === "completed" && !state.pods.some((pod) => pod.phase === "pending"))) return state;
      return { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset": return initialKubernetesPodSchedulingState;
    case "tick": return tick(state);
    case "add-pod": {
      const pod = { id: state.nextPodId, name: `web-${state.nextPodId}`, phase: "pending" as const };
      return { ...state, pods: [...state.pods, pod], nextPodId: state.nextPodId + 1, playback: state.playback === "completed" ? "idle" : state.playback, decision: `${pod.name} を Pending キューへ追加しました。` };
    }
    case "set-capacity": {
      const nodeCapacity = clampCapacity(action.capacity);
      return { ...state, nodeCapacity, playback: state.playback === "blocked" ? "paused" : state.playback, decision: `Node 容量を ${nodeCapacity} Pod に変更しました。配置済み Pod は維持されます。` };
    }
    case "reschedule": {
      const target = state.pods.find((pod) => pod.id === action.podId && pod.phase === "ready");
      if (!target) return state;
      return { ...state, pods: updatePod(state, target.id, "pending"), activePodId: null, playback: "idle", decision: `${target.name} を再配置するため Pending に戻しました。` };
    }
  }
}

export const phaseLabels: Record<PodPhase, string> = { pending: "Pending Pod", scheduler: "Scheduler", selected: "Node selected", starting: "Starting", ready: "Ready" };

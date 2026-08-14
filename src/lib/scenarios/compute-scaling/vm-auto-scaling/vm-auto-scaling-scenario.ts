export type Playback = "idle" | "running" | "paused";
export type VmStatus = "ready" | "launching" | "draining";

export interface VmInstance { id: number; status: VmStatus; transitionTicks: number; }
export interface VmAutoScalingState {
  playback: Playback; load: number; minInstances: number; maxInstances: number;
  scaleOutThreshold: number; scaleInThreshold: number; instances: readonly VmInstance[];
  nextInstanceId: number; decision: string; lastEvent: string;
}
export type VmAutoScalingAction =
  | { type: "start" } | { type: "pause" } | { type: "reset" } | { type: "tick" }
  | { type: "set-load"; value: number } | { type: "set-min"; value: number }
  | { type: "set-max"; value: number } | { type: "set-scale-out"; value: number }
  | { type: "set-scale-in"; value: number };

export const initialVmAutoScalingState: VmAutoScalingState = {
  playback: "idle", load: 75, minInstances: 2, maxInstances: 5,
  scaleOutThreshold: 70, scaleInThreshold: 35,
  instances: [{ id: 1, status: "ready", transitionTicks: 0 }, { id: 2, status: "ready", transitionTicks: 0 }],
  nextInstanceId: 3,
  decision: "負荷が Scale out 条件以上です。Start すると VM を追加します。",
  lastEvent: "合成した初期状態",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

function evaluate(state: VmAutoScalingState): VmAutoScalingState {
  const transitioning = state.instances.find((instance) => instance.status !== "ready");
  if (transitioning) {
    if (transitioning.transitionTicks > 1) {
      return {
        ...state,
        instances: state.instances.map((instance) => instance.id === transitioning.id ? { ...instance, transitionTicks: instance.transitionTicks - 1 } : instance),
        decision: transitioning.status === "launching"
          ? `VM ${transitioning.id} を起動しています。ヘルスチェック完了後に Ready になります。`
          : `VM ${transitioning.id} は Draining 中です。処理中の接続がなくなるまで待機します。`,
      };
    }
    if (transitioning.status === "launching") {
      return {
        ...state,
        instances: state.instances.map((instance) => instance.id === transitioning.id ? { ...instance, status: "ready", transitionTicks: 0 } : instance),
        decision: `Scale out 完了: VM ${transitioning.id} が Ready になりました。`,
        lastEvent: `VM ${transitioning.id}: Launching → Ready`,
      };
    }
    return {
      ...state,
      instances: state.instances.filter((instance) => instance.id !== transitioning.id),
      decision: `Scale in 完了: VM ${transitioning.id} を安全に停止しました。`,
      lastEvent: `VM ${transitioning.id}: Draining → Stopped`,
    };
  }
  if (state.load >= state.scaleOutThreshold) {
    if (state.instances.length >= state.maxInstances) return { ...state, decision: `最大台数 ${state.maxInstances} 台のため Scale out できません（境界ケース）。` };
    const id = state.nextInstanceId;
    return {
      ...state, instances: [...state.instances, { id, status: "launching", transitionTicks: 2 }], nextInstanceId: id + 1,
      decision: `負荷 ${state.load}% が ${state.scaleOutThreshold}% 以上のため VM ${id} を起動します。`, lastEvent: `Scale out: VM ${id} を追加`,
    };
  }
  if (state.load <= state.scaleInThreshold) {
    if (state.instances.length <= state.minInstances) return { ...state, decision: `最小台数 ${state.minInstances} 台を維持するため Scale in しません（境界ケース）。` };
    const target = state.instances[state.instances.length - 1];
    return {
      ...state,
      instances: state.instances.map((instance) => instance.id === target.id ? { ...instance, status: "draining", transitionTicks: 2 } : instance),
      decision: `負荷 ${state.load}% が ${state.scaleInThreshold}% 以下のため VM ${target.id} を Draining にします。`, lastEvent: `Scale in: VM ${target.id} を Draining`,
    };
  }
  return { ...state, decision: `負荷 ${state.load}% は条件の間にあるため、現在の ${state.instances.length} 台を維持します。` };
}

export function vmAutoScalingReducer(state: VmAutoScalingState, action: VmAutoScalingAction): VmAutoScalingState {
  switch (action.type) {
    case "start": return state.playback === "running" ? state : { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused", decision: `一時停止中: ${state.decision}` } : state;
    case "reset": return initialVmAutoScalingState;
    case "tick": return state.playback === "running" ? evaluate(state) : state;
    case "set-load": return { ...state, load: clamp(action.value, 0, 100) };
    case "set-min": return { ...state, minInstances: clamp(action.value, 1, state.maxInstances) };
    case "set-max": return { ...state, maxInstances: clamp(action.value, state.minInstances, 8) };
    case "set-scale-out": return { ...state, scaleOutThreshold: clamp(action.value, state.scaleInThreshold + 5, 95) };
    case "set-scale-in": return { ...state, scaleInThreshold: clamp(action.value, 5, state.scaleOutThreshold - 5) };
  }
}

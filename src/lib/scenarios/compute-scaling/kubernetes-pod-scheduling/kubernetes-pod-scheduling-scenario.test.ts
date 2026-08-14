import { describe, expect, it } from "vitest";
import { initialKubernetesPodSchedulingState, kubernetesPodSchedulingReducer, type KubernetesPodSchedulingState } from "./kubernetes-pod-scheduling-scenario";

function runTicks(state: KubernetesPodSchedulingState, count: number) {
  let next = kubernetesPodSchedulingReducer(state, { type: "start" });
  for (let index = 0; index < count; index += 1) next = kubernetesPodSchedulingReducer(next, { type: "tick" });
  return next;
}

describe("kubernetesPodSchedulingReducer", () => {
  it("Pending Pod を Scheduler、Node 選択、Starting、Ready の順に進める", () => {
    let state = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "start" });
    for (const phase of ["scheduler", "selected", "starting", "ready"] as const) {
      state = kubernetesPodSchedulingReducer(state, { type: "tick" });
      expect(state.pods.find((pod) => pod.id === 2)?.phase).toBe(phase);
    }
    expect(state.playback).toBe("completed");
  });

  it("容量不足では配置せず、判断理由を示す", () => {
    const limited = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "set-capacity", capacity: 1 });
    const state = runTicks(limited, 2);
    expect(state.playback).toBe("blocked");
    expect(state.pods.find((pod) => pod.id === 2)?.phase).toBe("scheduler");
    expect(state.decision).toContain("空き容量がありません");
  });

  it("容量を増やすとブロックした Pod の配置を再開できる", () => {
    const limited = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "set-capacity", capacity: 1 });
    const blocked = runTicks(limited, 2);
    const expanded = kubernetesPodSchedulingReducer(blocked, { type: "set-capacity", capacity: 2 });
    expect(runTicks(expanded, 3).pods.find((pod) => pod.id === 2)?.phase).toBe("ready");
  });

  it("Pod 追加と Ready Pod の再配置を Pending として扱う", () => {
    const added = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "add-pod" });
    expect(added.pods.at(-1)).toMatchObject({ name: "web-3", phase: "pending" });
    const rescheduled = kubernetesPodSchedulingReducer(added, { type: "reschedule", podId: 1 });
    expect(rescheduled.pods.find((pod) => pod.id === 1)?.phase).toBe("pending");
  });

  it("Pause 中の tick は状態を変えず、Reset は合成初期状態へ戻す", () => {
    const paused = { ...initialKubernetesPodSchedulingState, playback: "paused" as const };
    expect(kubernetesPodSchedulingReducer(paused, { type: "tick" })).toBe(paused);
    const changed = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "add-pod" });
    expect(kubernetesPodSchedulingReducer(changed, { type: "reset" })).toEqual(initialKubernetesPodSchedulingState);
  });
});

import { describe, expect, it } from "vitest";
import { initialVmAutoScalingState, vmAutoScalingReducer, type VmAutoScalingState } from "./vm-auto-scaling-scenario";

const tick = (state: VmAutoScalingState, count = 1) => {
  let current = state;
  for (let index = 0; index < count; index += 1) current = vmAutoScalingReducer(current, { type: "tick" });
  return current;
};

describe("vmAutoScalingReducer", () => {
  it("負荷上昇で VM を起動し Ready にする", () => {
    const running = vmAutoScalingReducer(initialVmAutoScalingState, { type: "start" });
    const launching = tick(running);
    expect(launching.instances.at(-1)?.status).toBe("launching");
    const ready = tick(launching, 2);
    expect(ready.instances).toHaveLength(3);
    expect(ready.instances.at(-1)?.status).toBe("ready");
    expect(ready.lastEvent).toContain("Launching → Ready");
  });
  it("負荷低下で VM を Draining にして停止する", () => {
    const state = { ...initialVmAutoScalingState, playback: "running" as const, load: 20, instances: [...initialVmAutoScalingState.instances, { id: 3, status: "ready" as const, transitionTicks: 0 }] };
    const draining = tick(state);
    expect(draining.instances.at(-1)?.status).toBe("draining");
    const stopped = tick(draining, 2);
    expect(stopped.instances).toHaveLength(2);
    expect(stopped.lastEvent).toContain("Draining → Stopped");
  });
  it("最大・最小台数でスケールを抑止する", () => {
    const max = tick({ ...initialVmAutoScalingState, playback: "running", maxInstances: 2 });
    expect(max.decision).toContain("最大台数");
    const min = tick({ ...initialVmAutoScalingState, playback: "running", load: 10 });
    expect(min.decision).toContain("最小台数");
  });
  it("Pause 中は進行せず Reset で合成した初期状態に戻る", () => {
    const changed = tick(vmAutoScalingReducer(initialVmAutoScalingState, { type: "start" }));
    const paused = vmAutoScalingReducer(changed, { type: "pause" });
    expect(vmAutoScalingReducer(paused, { type: "tick" })).toBe(paused);
    expect(vmAutoScalingReducer(paused, { type: "reset" })).toEqual(initialVmAutoScalingState);
  });
  it("設定値の順序を保つ", () => {
    expect(vmAutoScalingReducer(initialVmAutoScalingState, { type: "set-min", value: 7 }).minInstances).toBe(5);
    expect(vmAutoScalingReducer(initialVmAutoScalingState, { type: "set-scale-in", value: 90 }).scaleInThreshold).toBe(65);
  });
});

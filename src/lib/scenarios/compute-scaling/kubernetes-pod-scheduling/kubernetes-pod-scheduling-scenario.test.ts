import { describe, expect, it } from "vitest";
import { initialKubernetesPodSchedulingState, kubernetesPodSchedulingReducer } from "./kubernetes-pod-scheduling-scenario";

describe("kubernetesPodSchedulingReducer", () => {
  it("飛行機2・陸上戦車4・タワー砲手2の編成で開始する", () => {
    const count = (unit: string) => initialKubernetesPodSchedulingState.pods.filter((pod) => pod.unit === unit).length;
    expect(count("fighter")).toBe(2);
    expect(count("tank")).toBe(4);
    expect(count("gunner")).toBe(2);
  });

  it("ReplicaSetの補充Podは展開を経てReadyになる", () => {
    const attacked = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "enemy-wave", victimId: 1 });
    const deploying = kubernetesPodSchedulingReducer(attacked, { type: "reconcile" });
    expect(deploying.pods.at(-1)).toMatchObject({ unit: "fighter", node: "air", status: "deploying" });
    const ready = kubernetesPodSchedulingReducer(deploying, { type: "complete-deployment" });
    expect(ready.pods.filter((pod) => pod.status === "ready")).toHaveLength(8);
    expect(ready.pods).toHaveLength(8);
  });

  it("Self-Healing無効時は不足状態を維持する", () => {
    const disabled = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "toggle-self-healing" });
    const attacked = kubernetesPodSchedulingReducer(disabled, { type: "enemy-wave", victimId: 3 });
    expect(attacked.pods.filter((pod) => pod.status === "ready")).toHaveLength(7);
  });

  it("手動Reconcileで不足したPodを復旧する", () => {
    const disabled = kubernetesPodSchedulingReducer(initialKubernetesPodSchedulingState, { type: "toggle-self-healing" });
    const attacked = kubernetesPodSchedulingReducer(disabled, { type: "enemy-wave", victimId: 7 });
    const deploying = kubernetesPodSchedulingReducer(attacked, { type: "reconcile" });
    const recovered = kubernetesPodSchedulingReducer(deploying, { type: "complete-deployment" });
    expect(recovered.pods.filter((pod) => pod.status === "ready")).toHaveLength(8);
    expect(recovered.events.at(-1)?.message).toContain("Ready");
  });
});

import { describe, expect, it } from "vitest";
import {
  advanceGatewayScene,
  egressProgress,
  ingressProgress,
  initialGatewaySceneState,
  phaseForTick,
  SCENE_TICKS,
} from "./internet-gateway-and-nat-gateway-scenario";

describe("Internet Gateway / NAT Gateway scene", () => {
  it("plays ingress before private egress", () => {
    expect(phaseForTick(0)).toBe("public-ingress");
    expect(ingressProgress(4)).toBe(1);
    expect(phaseForTick(5)).toBe("route-handoff");
    expect(phaseForTick(6)).toBe("private-egress");
    expect(egressProgress(10)).toBe(1);
  });

  it("returns to the initial state at the loop boundary", () => {
    let state = initialGatewaySceneState;
    for (let count = 0; count < SCENE_TICKS; count += 1) {
      state = advanceGatewayScene(state);
    }
    expect(state).toEqual({ ...initialGatewaySceneState, cycle: 1 });
  });

  it("clamps packet progress to the visible route", () => {
    expect(ingressProgress(10)).toBe(1);
    expect(egressProgress(0)).toBe(0);
  });
});

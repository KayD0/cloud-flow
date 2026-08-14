import { describe, expect, it } from "vitest";
import {
  initialPrivatePathState,
  PRIVATE_PATH_PHASES,
  privatePathReducer,
} from "./private-link-private-endpoint-scenario";

describe("Private Path animation", () => {
  it("advances through the private route in the expected order", () => {
    let state = initialPrivatePathState;
    const visited = [state.phase];

    for (let index = 1; index < PRIVATE_PATH_PHASES.length; index += 1) {
      state = privatePathReducer(state, { type: "advance" });
      visited.push(state.phase);
    }

    expect(visited).toEqual(PRIVATE_PATH_PHASES);
    expect(state).toEqual({ phase: "delivered", cycle: 1 });
  });

  it("returns to ready and increments the cycle at the loop boundary", () => {
    const looped = privatePathReducer(
      { phase: "delivered", cycle: 7 },
      { type: "advance" },
    );

    expect(looped).toEqual({ phase: "ready", cycle: 8 });
  });

  it("reset always returns to the initial presentation state", () => {
    expect(
      privatePathReducer(
        { phase: "transferring", cycle: 4 },
        { type: "reset" },
      ),
    ).toEqual(initialPrivatePathState);
  });
});

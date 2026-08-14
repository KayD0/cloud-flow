export const DNS_SCENE_DURATION_MS = 12_000;

export const DNS_PHASES = ["resolving", "primary-connected", "failure-detected", "failing-over", "secondary-connected"] as const;
export type DnsPhase = (typeof DNS_PHASES)[number];

export interface DnsSceneState {
  phase: DnsPhase;
  phaseIndex: number;
  elapsedMs: number;
  resolverAnswer: "primary" | "secondary";
  primaryStatus: "healthy" | "down";
  secondaryStatus: "standby" | "active";
  route: "resolver" | "primary" | "health-check" | "secondary";
}

const phaseStarts = [0, 2_400, 4_800, 7_200, 9_600] as const;

export function getDnsSceneState(elapsedMs: number): DnsSceneState {
  const elapsed = ((elapsedMs % DNS_SCENE_DURATION_MS) + DNS_SCENE_DURATION_MS) % DNS_SCENE_DURATION_MS;
  let phaseIndex = phaseStarts.length - 1;
  for (let index = 1; index < phaseStarts.length; index += 1) {
    if (elapsed < phaseStarts[index]) { phaseIndex = index - 1; break; }
  }
  const phase = DNS_PHASES[phaseIndex];
  const primaryIsDown = phaseIndex >= 2;
  const failoverComplete = phaseIndex >= 3;
  return {
    phase,
    phaseIndex,
    elapsedMs: elapsed,
    resolverAnswer: failoverComplete ? "secondary" : "primary",
    primaryStatus: primaryIsDown ? "down" : "healthy",
    secondaryStatus: failoverComplete ? "active" : "standby",
    route: phase === "resolving" ? "resolver" : phase === "primary-connected" ? "primary" : phase === "failure-detected" ? "health-check" : "secondary",
  };
}

export const reducedMotionDnsSceneState = getDnsSceneState(10_000);

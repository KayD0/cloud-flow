import type { DesignTemplate } from "../../model";

const template = {
  slug: "timeout-and-bounded-retry",
  name: "Timeout and Bounded Retry",
  summary: "Timeoutを契機に、上限付きRetryとBackoff、成功または打ち切りまでの判断を観察します。",
  primaryCategory: "reliability-recovery",
  tags: ["Timeout and Bounded Retry", "reliability-recovery"],
  concepts: ["Timeout", "Bounded Retry", "Backoff"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request flow", "State transition", "Backoff"],
  actions: ["Play", "Pause", "Reset", "Inject failure"],
  href: "/templates/reliability-recovery/timeout-and-bounded-retry",
} as const satisfies DesignTemplate;

export default template;

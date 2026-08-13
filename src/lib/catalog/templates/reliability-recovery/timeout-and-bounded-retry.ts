import type { DesignTemplate } from "../../model";

const template = {
  slug: "timeout-and-bounded-retry",
  name: "Timeout and Bounded Retry",
  summary: "Timeout後の上限付きRetryとBackoff、成功・打ち切りを示します。",
  primaryCategory: "reliability-recovery",
  tags: ["Timeout and Bounded Retry", "reliability-recovery"],
  concepts: ["Timeout and Bounded Retry"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/reliability-recovery/timeout-and-bounded-retry",
} as const satisfies DesignTemplate;

export default template;

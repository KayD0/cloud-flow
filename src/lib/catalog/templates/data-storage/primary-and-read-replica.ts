import type { DesignTemplate } from "../../model";

const template = {
  slug: "primary-and-read-replica",
  name: "Primary and Read Replica",
  summary: "Primary への Write、Read Replica への複製、Read の分散と複製遅延による差をたどります。",
  primaryCategory: "data-storage",
  tags: ["Read Replica", "Replication", "Data & Storage"],
  concepts: ["Primary", "Read Replica", "Synchronous and asynchronous replication", "Replication lag"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Data flow", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/primary-and-read-replica",
} as const satisfies DesignTemplate;

export default template;

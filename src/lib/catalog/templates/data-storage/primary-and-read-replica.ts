import type { DesignTemplate } from "../../model";

const template = {
  slug: "primary-and-read-replica",
  name: "Primary and Read Replica",
  summary: "PrimaryへのWrite、Replicaへの複製、Readの分散をたどります。",
  primaryCategory: "data-storage",
  tags: ["Primary and Read Replica", "data-storage"],
  concepts: ["Primary and Read Replica"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/primary-and-read-replica",
} as const satisfies DesignTemplate;

export default template;

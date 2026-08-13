import type { DesignTemplate } from "../../model";

const template = {
  slug: "object-block-file-storage",
  name: "Object / Block / File Storage",
  summary: "Object、Block、File Storageのアクセス方法を比較します。",
  primaryCategory: "data-storage",
  tags: ["Object / Block / File Storage", "data-storage"],
  concepts: ["Object / Block / File Storage"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/object-block-file-storage",
} as const satisfies DesignTemplate;

export default template;

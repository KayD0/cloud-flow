import type { DesignTemplate } from "../../model";

const template = {
  slug: "object-block-file-storage",
  name: "Object / Block / File Storage",
  summary: "保存単位とアクセス経路の違いを、合成データの Save / Retrieve で比較します。",
  primaryCategory: "data-storage",
  tags: ["Object Storage", "Block Storage", "File Storage", "data-storage"],
  concepts: ["Storage access unit", "Save / Retrieve", "Attached volume", "Mounted share"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Application / VM → Storage → Save / Retrieve", "State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/data-storage/object-block-file-storage",
} as const satisfies DesignTemplate;

export default template;

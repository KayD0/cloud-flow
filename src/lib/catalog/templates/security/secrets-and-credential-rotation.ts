import type { DesignTemplate } from "../../model";

const template = {
  slug: "secrets-and-credential-rotation",
  name: "Secrets and Credential Rotation",
  summary: "新旧Credentialの切り替えと旧版の失効を示します。",
  primaryCategory: "security",
  tags: ["Secrets and Credential Rotation", "security"],
  concepts: ["Secrets and Credential Rotation"],
  difficulty: "Beginner",
  status: "planned",
  motions: ["State transition"],
  actions: ["Play", "Pause", "Reset"],
  href: "/templates/security/secrets-and-credential-rotation",
} as const satisfies DesignTemplate;

export default template;

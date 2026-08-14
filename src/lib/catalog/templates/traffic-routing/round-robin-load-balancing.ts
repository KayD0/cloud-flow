import type { DesignTemplate } from "../../model";

const template = {
  slug: "round-robin-load-balancing",
  name: "ラウンドロビン・ディーラー",
  summary: "到着する Request を複数の Server へ順番に配り、処理済み Response と負荷状態の循環を自動再生します。",
  primaryCategory: "traffic-routing",
  tags: ["Round Robin", "Load Balancing", "Traffic & Routing"],
  concepts: ["Round Robin Load Balancing", "Request distribution"],
  difficulty: "Beginner",
  status: "available",
  motions: ["Request arrival", "Sequential routing", "Response return", "Loop reset"],
  actions: [],
  href: "/templates/traffic-routing/round-robin-load-balancing",
} as const satisfies DesignTemplate;

export default template;

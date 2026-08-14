import Link from "next/link";
import type { DesignTemplate } from "@/lib/catalog/model";

export function TemplateCard({ template }: { template: DesignTemplate }) {
  return (
    <article className="template-card">
      <div className="template-card-heading">
        <div>
          <p className="template-kicker">INFRASTRUCTURE TEMPLATE</p>
          <h2>{template.name}</h2>
        </div>
        <span className={`template-status ${template.status}`}>
          {template.status === "available" ? "Available" : "Planned"}
        </span>
      </div>
      <p className="template-summary">{template.summary}</p>
      <ul className="tag-list" aria-label="タグ">
        {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <Link className="template-link" href={template.href} aria-label={`${template.name} を開く`}>
        {template.status === "available" ? "Open template" : "View planned template"} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

import Link from "next/link";
import type { DesignTemplate } from "@/lib/catalog/model";

export function TemplateCard({ template }: { template: DesignTemplate }) {
  return (
    <article className="template-card">
      <div className="template-card-heading">
        <div>
          <p className="template-kicker">INTERACTIVE TEMPLATE</p>
          <h2>{template.name}</h2>
        </div>
        <span className="difficulty">{template.difficulty}</span>
      </div>
      <p className="template-summary">{template.summary}</p>
      <dl className="template-metadata">
        <div>
          <dt>Concepts</dt>
          <dd>{template.concepts.join(" · ")}</dd>
        </div>
        <div>
          <dt>Motion</dt>
          <dd>{template.motions.join(" · ")}</dd>
        </div>
        <div>
          <dt>Actions</dt>
          <dd>{template.actions.join(" · ")}</dd>
        </div>
      </dl>
      <ul className="tag-list" aria-label="補助タグ">
        {template.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <Link className="template-link" href={template.href} aria-label={`${template.name} の詳細を開く`}>
        Explore template <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

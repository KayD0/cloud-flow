import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Cloud Flow ホーム">
        <span>CF</span> CLOUD FLOW
      </Link>
      <nav aria-label="メインナビゲーション">
        <Link href="/#catalog">Catalog</Link>
        <Link href="/node-actions">Node Action</Link>
        <a href="https://github.com/KayD0/cloud-flow">GitHub ↗</a>
      </nav>
    </header>
  );
}

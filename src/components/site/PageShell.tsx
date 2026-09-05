import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "@phosphor-icons/react";

export function PageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="border-b border-vault-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-vault-hairline text-xs hover:bg-vault-overlay-strong transition-colors"
          >
            <ArrowLeft size={13} /> Home
          </Link>
          <span className="text-xs text-vault-fg-muted truncate">{title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-3 text-sm text-vault-fg-muted leading-relaxed">{intro}</p>}
        {updated && (
          <p className="mt-2 text-xs text-vault-fg-muted/70">Last updated: {updated}</p>
        )}
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-vault-fg-muted">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-vault-fg">{heading}</h2>
      {children}
    </section>
  );
}

export function SiteFooter() {
  const links = [
    { to: "/terms", label: "Terms" },
    { to: "/privacy", label: "Privacy" },
    { to: "/cookies", label: "Cookies" },
    { to: "/support", label: "Support" },
  ] as const;
  return (
    <footer className="border-t border-vault-hairline">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-vault-fg-muted">
        <span>© {new Date().getFullYear()} unExe</span>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-vault-fg transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}

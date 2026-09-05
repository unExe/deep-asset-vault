import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKey } from "@phosphor-icons/react";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access denied — vault.unExe" },
      { name: "description", content: "This part of vault.unExe is restricted." },
      { property: "og:title", content: "Access denied — vault.unExe" },
      { property: "og:description", content: "This part of vault.unExe is restricted." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccessDeniedPage,
});

export function AccessDeniedScreen({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg text-vault-fg px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-14 h-14 grid place-items-center rounded-2xl border border-vault-hairline bg-vault-overlay">
          <LockKey size={24} weight="duotone" />
        </div>
        <p className="mt-6 text-xs font-mono text-vault-fg-muted">403</p>
        <h1 className="mt-1 text-2xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-vault-fg-muted leading-relaxed">
          {reason ??
            "You don't have permission to open this page. If you're the owner, unlock the editor first — sessions expire after a while."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/vault"
            className="px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90"
          >
            Back to the vault
          </Link>
          <Link
            to="/support"
            className="px-4 py-2 rounded-md border border-vault-hairline text-sm hover:bg-vault-overlay-strong transition-colors"
          >
            Get help
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedPage() {
  return <AccessDeniedScreen />;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "@phosphor-icons/react";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Under maintenance — vault.unExe" },
      { name: "description", content: "vault.unExe is briefly offline for maintenance." },
      { property: "og:title", content: "Under maintenance — vault.unExe" },
      { property: "og:description", content: "vault.unExe is briefly offline for maintenance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MaintenancePage,
});

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg text-vault-fg px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-14 h-14 grid place-items-center rounded-2xl border border-vault-hairline bg-vault-overlay">
          <Wrench size={24} weight="duotone" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">We'll be right back</h1>
        <p className="mt-3 text-sm text-vault-fg-muted leading-relaxed">
          The vault is being updated. Nothing is lost — downloads and folders will be back as soon
          as the work is finished. Thanks for your patience.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
          <Link
            to="/support"
            className="px-4 py-2 rounded-md border border-vault-hairline text-sm hover:bg-vault-overlay-strong transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}

function MaintenancePage() {
  return <MaintenanceScreen />;
}

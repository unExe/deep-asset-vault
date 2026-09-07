import { Link } from "@tanstack/react-router";
import { WarningCircle } from "@phosphor-icons/react";

export function ErrorScreen({ error }: { error?: Error }) {
  const message =
    error?.message && error.message.length < 200
      ? error.message
      : "Something went wrong while loading this page.";
  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <WarningCircle size={36} className="mx-auto text-vault-fg-muted" />
        <h1 className="text-2xl font-semibold">That didn’t load</h1>
        <p className="text-sm text-vault-fg-muted leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            to="/"
            className="px-4 py-2 rounded-md border border-vault-hairline text-sm hover:bg-vault-overlay-strong transition-colors"
          >
            Go home
          </Link>
        </div>
        <p className="text-xs text-vault-fg-muted/70 pt-2">
          Still stuck? <Link to="/support" className="underline">Contact support</Link>.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowSquareOut, Warning } from "@phosphor-icons/react";
import { loadSettings } from "@/lib/user-settings";

/**
 * Intercepts clicks on links that leave this site and asks for confirmation,
 * when the user enabled "confirm before leaving" in settings.
 */
export function ExternalLinkGuard() {
  const [pending, setPending] = useState<{ url: string; target: string } | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      if (!loadSettings().confirmExternalLinks) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin === window.location.origin) return;
      e.preventDefault();
      setPending({ url: url.href, target: anchor.getAttribute("target") || "_blank" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;

  const go = () => {
    window.open(pending.url, pending.target, "noopener,noreferrer");
    setPending(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setPending(null)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-vault-hairline bg-vault-menu-bg p-6 text-vault-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Warning size={18} className="text-vault-fg-muted" />
          <h2 className="text-sm font-semibold">Leaving vault.unExe</h2>
        </div>
        <p className="text-xs text-vault-fg-muted mb-2">You're about to open an external site:</p>
        <p className="text-xs font-mono break-all p-2.5 rounded-md bg-vault-overlay border border-vault-hairline mb-5">
          {pending.url}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setPending(null)}
            className="px-3 py-2 rounded-md border border-vault-hairline text-sm hover:bg-vault-overlay-strong"
          >
            Cancel
          </button>
          <button
            onClick={go}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90"
          >
            <ArrowSquareOut size={14} /> Continue
          </button>
        </div>
      </div>
    </div>
  );
}

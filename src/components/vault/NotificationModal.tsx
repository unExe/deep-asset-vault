import { useEffect } from "react";
import { X as XIcon, Megaphone } from "@phosphor-icons/react";
import { markAllSeen, type Announcement } from "@/lib/announcements";

interface Props {
  items: Announcement[];
  onClose: () => void;
}

export function NotificationModal({ items, onClose }: Props) {
  useEffect(() => {
    markAllSeen(items);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-vault-hairline bg-vault-menu-bg text-vault-fg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-vault-hairline">
          <Megaphone size={16} weight="duotone" />
          <h2 className="text-sm font-medium">Announcements</h2>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {items.length === 0 ? (
            <p className="text-xs text-vault-fg-muted py-10 text-center">Nothing announced yet.</p>
          ) : (
            items.map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-vault-hairline bg-vault-overlay overflow-hidden"
              >
                {a.banner_url && (
                  <img src={a.banner_url} alt="" loading="lazy" className="w-full h-36 object-cover" />
                )}
                <div className="p-3">
                  <h3 className="text-sm font-medium">{a.title}</h3>
                  {a.description && (
                    <p className="mt-1 text-xs leading-relaxed text-vault-fg-muted whitespace-pre-wrap">
                      {a.description}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-vault-fg-muted">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

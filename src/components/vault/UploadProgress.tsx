import { CheckCircle, XCircle, CircleNotch, FilmSlate, X, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useUploadStore } from "@/lib/upload-store";

export function UploadProgress() {
  const { items, collapsed, toggleCollapsed, clear } = useUploadStore();
  if (items.length === 0) return null;

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  const remaining = items.length - done - failed;
  const allDone = remaining === 0;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(92vw,340px)] rounded-lg border border-vault-hairline bg-vault-menu-bg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-vault-hairline">
        <div className="flex items-center gap-2 text-xs text-vault-fg">
          {!allDone && <CircleNotch size={14} className="animate-spin" />}
          <span>
            {allDone
              ? `${done} upload${done === 1 ? "" : "s"} complete`
              : `Uploading ${remaining} of ${items.length}`}
          </span>
          {failed > 0 && <span className="text-vault-danger">· {failed} failed</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <CaretUp size={13} /> : <CaretDown size={13} />}
          </button>
          {allDone && (
            <button
              onClick={clear}
              className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <ul className="max-h-64 overflow-y-auto">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-vault-hairline/50 last:border-0">
              <FilmSlate size={14} className="text-vault-fg-muted shrink-0" />
              <span className="flex-1 truncate text-vault-fg" title={it.name}>{it.name}</span>
              {it.status === "done" && <CheckCircle size={15} weight="fill" className="text-emerald-500 shrink-0" />}
              {it.status === "error" && <XCircle size={15} weight="fill" className="text-vault-danger shrink-0" />}
              {(it.status === "queued" || it.status === "uploading") && (
                <CircleNotch size={13} className="animate-spin text-vault-fg-muted shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

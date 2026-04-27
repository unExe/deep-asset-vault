import { Eye, DownloadSimple, Trash, X, Copy, Scissors, PencilSimple, Info, Star, PushPin } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { type Asset } from "@/hooks/useFileSystem";

interface Props {
  assets: Asset[];
  isEditorMode: boolean;
  busy: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onRename: () => void;
  onInfo: () => void;
  onFavorite: () => void;
  onAddToSidebar: () => void;
  canAddToSidebar: boolean;
}

export function ActionBar({
  assets,
  isEditorMode,
  busy,
  onPreview,
  onDownload,
  onDelete,
  onCopy,
  onCut,
  onRename,
  onInfo,
  onFavorite,
  onAddToSidebar,
  canAddToSidebar,
}: Props) {
  const { selected, clear } = useVaultStore();
  if (selected.size === 0) return null;

  const selectedAssets = assets.filter((a) => selected.get(a.id) === "asset");
  const totalCount = selected.size;
  const canPreview = selectedAssets.length >= 1;
  const canRename = totalCount === 1;
  const canInfo = totalCount === 1;
  const canFav = totalCount === 1;

  const btn = "flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-vault-overlay-strong text-sm text-vault-fg transition-colors shrink-0";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 bg-vault-menu-bg border border-vault-hairline rounded-full shadow-2xl max-w-[95vw] overflow-x-auto">
      <span className="px-3 text-xs text-vault-fg-muted tabular-nums shrink-0">{totalCount} selected</span>
      <div className="w-px h-5 bg-vault-hairline shrink-0" />
      {canPreview && (
        <button onClick={onPreview} disabled={busy} className={btn}>
          <Eye size={16} /> <span className="hidden sm:inline">Preview</span>
        </button>
      )}
      <button onClick={onDownload} disabled={busy} className={`${btn} disabled:opacity-50`}>
        <DownloadSimple size={16} /> <span className="hidden sm:inline">{busy ? "…" : "Download"}</span>
      </button>
      {canFav && (
        <button onClick={onFavorite} className={btn}>
          <Star size={16} /> <span className="hidden sm:inline">Favorite</span>
        </button>
      )}
      {canAddToSidebar && isEditorMode && (
        <button onClick={onAddToSidebar} className={btn}>
          <PushPin size={16} /> <span className="hidden sm:inline">Add to sidebar</span>
        </button>
      )}
      {canInfo && (
        <button onClick={onInfo} className={btn}>
          <Info size={16} /> <span className="hidden sm:inline">Info</span>
        </button>
      )}
      {isEditorMode && (
        <>
          <button onClick={onCopy} className={btn}>
            <Copy size={16} /> <span className="hidden sm:inline">Copy</span>
          </button>
          <button onClick={onCut} className={btn}>
            <Scissors size={16} /> <span className="hidden sm:inline">Cut</span>
          </button>
          {canRename && (
            <button onClick={onRename} className={btn}>
              <PencilSimple size={16} /> <span className="hidden sm:inline">Rename</span>
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-vault-danger/20 text-sm text-vault-danger transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash size={16} /> <span className="hidden sm:inline">Delete</span>
          </button>
        </>
      )}
      <div className="w-px h-5 bg-vault-hairline shrink-0" />
      <button
        onClick={clear}
        aria-label="Clear selection"
        className="p-1.5 rounded-full hover:bg-vault-overlay-strong text-vault-fg-muted hover:text-vault-fg shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

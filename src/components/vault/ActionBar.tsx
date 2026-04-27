import { Eye, DownloadSimple, Trash, X, Copy, Scissors, PencilSimple } from "@phosphor-icons/react";
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
}: Props) {
  const { selected, clear } = useVaultStore();
  if (selected.size === 0) return null;

  const selectedAssets = assets.filter((a) => selected.get(a.id) === "asset");
  const totalCount = selected.size;
  const canPreview = selectedAssets.length >= 1;
  const canRename = totalCount === 1;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 bg-neutral-950 border border-white/15 rounded-full shadow-2xl max-w-[95vw] overflow-x-auto">
      <span className="px-3 text-xs text-white/60 tabular-nums shrink-0">{totalCount} selected</span>
      <div className="w-px h-5 bg-white/10 shrink-0" />
      {canPreview && (
        <button
          onClick={onPreview}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors shrink-0"
        >
          <Eye size={16} /> <span className="hidden sm:inline">Preview</span>
        </button>
      )}
      <button
        onClick={onDownload}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors disabled:opacity-50 shrink-0"
      >
        <DownloadSimple size={16} /> <span className="hidden sm:inline">{busy ? "…" : "Download"}</span>
      </button>
      {isEditorMode && (
        <>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors shrink-0"
          >
            <Copy size={16} /> <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={onCut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors shrink-0"
          >
            <Scissors size={16} /> <span className="hidden sm:inline">Cut</span>
          </button>
          {canRename && (
            <button
              onClick={onRename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors shrink-0"
            >
              <PencilSimple size={16} /> <span className="hidden sm:inline">Rename</span>
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-500/20 text-sm text-red-400 transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash size={16} /> <span className="hidden sm:inline">Delete</span>
          </button>
        </>
      )}
      <div className="w-px h-5 bg-white/10 shrink-0" />
      <button
        onClick={clear}
        aria-label="Clear selection"
        className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

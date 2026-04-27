import { useCallback, useEffect, useMemo, useState } from "react";
import { PathBar } from "@/components/vault/PathBar";
import { FolderGrid } from "@/components/vault/FolderGrid";
import { ActionBar } from "@/components/vault/ActionBar";
import { PreviewModal } from "@/components/vault/PreviewModal";
import { UploadDropZone } from "@/components/vault/UploadDropZone";
import { ContextMenu, type MenuItem } from "@/components/vault/ContextMenu";
import { useFileSystem, type Asset } from "@/hooks/useFileSystem";
import { useVaultStore } from "@/lib/vault-store";
import { supabase } from "@/integrations/supabase/client";
import {
  collectAssetsRecursive,
  downloadSelection,
  pasteClipboard,
  renameItem,
} from "@/lib/vault-ops";
import {
  Eye,
  DownloadSimple,
  Trash,
  Copy,
  Scissors,
  ClipboardText,
  PencilSimple,
  FolderPlus,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface CtxState {
  x: number;
  y: number;
  target: { id: string; kind: "folder" | "asset" } | null;
}

export function AssetVaultApp({ isEditorMode }: { isEditorMode: boolean }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [histIdx, setHistIdx] = useState(0);
  const [previewQueue, setPreviewQueue] = useState<{ items: Asset[]; start: number } | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [ctx, setCtx] = useState<CtxState | null>(null);

  const { folders, assets, loading, refresh } = useFileSystem(folderId);
  const { selected, clear, selectOnly, setClipboard, clipboard } = useVaultStore();

  const navigate = useCallback(
    (id: string | null) => {
      clear();
      setFolderId(id);
      setHistory((h) => {
        const trimmed = h.slice(0, histIdx + 1);
        trimmed.push(id);
        return trimmed;
      });
      setHistIdx((i) => i + 1);
    },
    [clear, histIdx],
  );

  const goBack = () => {
    if (histIdx === 0) return;
    const next = histIdx - 1;
    setHistIdx(next);
    setFolderId(history[next]);
    clear();
  };
  const goForward = () => {
    if (histIdx >= history.length - 1) return;
    const next = histIdx + 1;
    setHistIdx(next);
    setFolderId(history[next]);
    clear();
  };

  // Filter by search
  const filteredFolders = useMemo(
    () => (search ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) : folders),
    [folders, search],
  );
  const filteredAssets = useMemo(
    () => (search ? assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())) : assets),
    [assets, search],
  );

  // === Action handlers ===
  const selectedAssets = assets.filter((a) => selected.get(a.id) === "asset");
  const selectedFolderIds = [...selected.entries()].filter(([, k]) => k === "folder").map(([id]) => id);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadSelection(selectedAssets, selectedFolderIds);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selected.size} item(s)?`)) return;
    setBusy(true);
    try {
      if (selectedAssets.length) {
        await supabase.storage.from("assets").remove(selectedAssets.map((a) => a.storage_path));
        await supabase.from("assets").delete().in("id", selectedAssets.map((a) => a.id));
      }
      if (selectedFolderIds.length) {
        await supabase.from("folders").delete().in("id", selectedFolderIds);
      }
      toast.success("Deleted");
      clear();
      void refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async () => {
    // Bulk preview: gather all selected assets + recurse folders for any media
    let queue: Asset[] = [...selectedAssets];
    if (selectedFolderIds.length) {
      const nested = await collectAssetsRecursive(selectedFolderIds);
      queue = [...queue, ...nested];
    }
    if (queue.length === 0) return toast.error("Nothing previewable selected");
    setPreviewQueue({ items: queue, start: 0 });
  };

  const handleCopy = () => {
    const items = [...selected.entries()].map(([id, kind]) => ({ id, kind }));
    setClipboard("copy", items);
    toast.success(`Copied ${items.length} item(s)`);
  };
  const handleCut = () => {
    const items = [...selected.entries()].map(([id, kind]) => ({ id, kind }));
    setClipboard("cut", items);
    toast.success(`Cut ${items.length} item(s)`);
  };
  const handlePaste = async () => {
    if (!clipboard) return;
    setBusy(true);
    try {
      await pasteClipboard(clipboard.items, clipboard.mode, folderId);
      toast.success("Pasted");
      if (clipboard.mode === "cut") setClipboard("copy", []); // clear cut after move
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Paste failed");
    } finally {
      setBusy(false);
    }
  };

  const startRename = (id: string) => {
    const f = folders.find((x) => x.id === id);
    const a = assets.find((x) => x.id === id);
    setRenameValue((f ?? a)?.name ?? "");
    setRenamingId(id);
  };
  const commitRename = async () => {
    if (!renamingId) return;
    const kind = folders.some((f) => f.id === renamingId) ? "folder" : "asset";
    try {
      await renameItem(renamingId, kind, renameValue.trim());
      toast.success("Renamed");
      setRenamingId(null);
      void refresh();
    } catch {
      toast.error("Rename failed");
    }
  };
  const cancelRename = () => setRenamingId(null);

  const handleNewFolder = async () => {
    const name = prompt("Folder name?");
    if (!name) return;
    const { error } = await supabase.from("folders").insert({ name, parent_id: folderId });
    if (error) toast.error(error.message);
    else {
      toast.success("Folder created");
      void refresh();
    }
  };

  // === Context menu handlers ===
  const openItemContext = (e: React.MouseEvent, target: { id: string; kind: "folder" | "asset" }) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected.has(target.id)) selectOnly(target.id, target.kind);
    setCtx({ x: e.clientX, y: e.clientY, target });
  };
  const openEmptyContext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, target: null });
  };

  const cutIds = useMemo(() => {
    if (!clipboard || clipboard.mode !== "cut") return new Set<string>();
    return new Set(clipboard.items.map((i) => i.id));
  }, [clipboard]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (renamingId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === "c" && selected.size) {
        e.preventDefault();
        handleCopy();
      } else if (meta && e.key === "x" && selected.size && isEditorMode) {
        e.preventDefault();
        handleCut();
      } else if (meta && e.key === "v" && isEditorMode) {
        e.preventDefault();
        void handlePaste();
      } else if (e.key === "F2" && selected.size === 1) {
        e.preventDefault();
        startRename([...selected.keys()][0]);
      } else if (e.key === "Delete" && selected.size && isEditorMode) {
        void handleDelete();
      } else if (e.key === "Escape") {
        clear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, clipboard, renamingId, isEditorMode]);

  // === Build context menu items based on context ===
  const buildContextItems = (): MenuItem[] => {
    const hasTarget = !!ctx?.target;
    const sel = selected.size;
    const onlyAsset = selectedAssets.length === sel && sel >= 1;
    if (hasTarget) {
      return [
        ...(ctx!.target!.kind === "folder"
          ? [{ label: "Open", icon: <FolderPlus size={14} />, onClick: () => navigate(ctx!.target!.id) }]
          : []),
        ...(onlyAsset || (ctx!.target!.kind === "asset")
          ? [{ label: sel > 1 ? `Preview (${sel})` : "Preview", icon: <Eye size={14} />, onClick: handlePreview }]
          : [{ label: "Bulk preview", icon: <Eye size={14} />, onClick: handlePreview }]),
        { label: sel > 1 ? `Download (${sel})` : "Download", icon: <DownloadSimple size={14} />, onClick: handleDownload },
        ...(isEditorMode
          ? ([
              { separator: true } as MenuItem,
              { label: "Copy", icon: <Copy size={14} />, onClick: handleCopy },
              { label: "Cut", icon: <Scissors size={14} />, onClick: handleCut },
              ...(sel === 1
                ? [{ label: "Rename", icon: <PencilSimple size={14} />, onClick: () => startRename([...selected.keys()][0]) }]
                : []),
              { separator: true } as MenuItem,
              { label: "Delete", icon: <Trash size={14} />, onClick: handleDelete, danger: true },
            ] as MenuItem[])
          : []),
      ];
    }
    // Empty area
    return [
      ...(isEditorMode
        ? ([
            { label: "New folder", icon: <FolderPlus size={14} />, onClick: handleNewFolder },
            {
              label: clipboard && clipboard.items.length ? `Paste (${clipboard.items.length})` : "Paste",
              icon: <ClipboardText size={14} />,
              onClick: handlePaste,
              disabled: !clipboard || clipboard.items.length === 0,
            },
          ] as MenuItem[])
        : ([{ label: "Refresh", icon: <ClipboardText size={14} />, onClick: () => void refresh() }] as MenuItem[])),
    ];
  };

  const grid = (
    <FolderGrid
      folders={filteredFolders}
      assets={filteredAssets}
      onOpenFolder={navigate}
      onOpenAsset={(a) => setPreviewQueue({ items: [a], start: 0 })}
      onContextMenu={openItemContext}
      onEmptyContextMenu={openEmptyContext}
      renamingId={renamingId}
      renameValue={renameValue}
      setRenameValue={setRenameValue}
      commitRename={commitRename}
      cancelRename={cancelRename}
      cutIds={cutIds}
    />
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="font-medium tracking-tight text-sm hidden sm:inline">vault.unExe</span>
          </div>
          <div className="flex-1 min-w-0">
            <PathBar
              folderId={folderId}
              onNavigate={navigate}
              onBack={goBack}
              onForward={goForward}
              canBack={histIdx > 0}
              canForward={histIdx < history.length - 1}
              onRefresh={() => void refresh()}
              search={search}
              onSearchChange={setSearch}
            />
          </div>
          {isEditorMode && (
            <span className="shrink-0 hidden sm:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/20 text-white/70">
              Editor
            </span>
          )}
        </div>
        {/* Mobile search */}
        <div className="sm:hidden px-3 pb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this folder…"
            className="w-full h-8 px-3 bg-white/[0.04] border border-white/10 rounded-md text-xs text-white placeholder:text-white/40 outline-none"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="text-white/40 text-sm py-32 text-center">Loading…</div>
        ) : isEditorMode ? (
          <UploadDropZone currentFolderId={folderId} onUploaded={refresh}>
            {grid}
          </UploadDropZone>
        ) : (
          grid
        )}
      </main>

      <ActionBar
        assets={assets}
        isEditorMode={isEditorMode}
        busy={busy}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onCut={handleCut}
        onRename={() => selected.size === 1 && startRename([...selected.keys()][0])}
      />

      {previewQueue && (
        <PreviewModal
          assets={previewQueue.items}
          startIndex={previewQueue.start}
          onClose={() => setPreviewQueue(null)}
        />
      )}

      {ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} items={buildContextItems()} onClose={() => setCtx(null)} />
      )}
    </div>
  );
}

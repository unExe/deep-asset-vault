import { useCallback, useEffect, useMemo, useState } from "react";
import { PathBar } from "@/components/vault/PathBar";
import { FolderGrid } from "@/components/vault/FolderGrid";
import { ActionBar } from "@/components/vault/ActionBar";
import { PreviewModal } from "@/components/vault/PreviewModal";
import { UploadDropZone, createInfoFile } from "@/components/vault/UploadDropZone";
import { UploadProgress } from "@/components/vault/UploadProgress";
import { ContextMenu, type MenuItem } from "@/components/vault/ContextMenu";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { AssetInfoDialog, FolderInfoDialog } from "@/components/vault/InfoDialog";
import { VaultSidebar, togglePinFolder } from "@/components/vault/VaultSidebar";
import { CommentSection } from "@/components/vault/CommentSection";
import { FolderInfoBanner } from "@/components/vault/FolderInfoEditor";

import { useFileSystem, type Asset } from "@/hooks/useFileSystem";
import { useVaultStore } from "@/lib/vault-store";
import { Favorites } from "@/lib/favorites";
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
  Info,
  ArrowsOut,
  Star,
  PushPin,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface CtxState {
  x: number;
  y: number;
  target: { id: string; kind: "folder" | "asset" } | null;
}

interface InfoState {
  kind: "asset" | "folder";
  id: string;
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
  const [info, setInfo] = useState<InfoState | null>(null);
  

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
      if (clipboard.mode === "cut") setClipboard("copy", []);
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
    const { data, error } = await supabase
      .from("folders")
      .insert({ name, parent_id: folderId })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Create failed");
      return;
    }
    await createInfoFile((data as { id: string }).id, name);
    toast.success("Folder created");
    void refresh();
  };

  const showInfoFor = (target: { id: string; kind: "folder" | "asset" }) => {
    setInfo({ id: target.id, kind: target.kind });
  };

  const showInfoForSelected = () => {
    if (selected.size !== 1) return;
    const [id, kind] = [...selected.entries()][0];
    showInfoFor({ id, kind });
  };

  const handleFavoriteSelected = () => {
    if (selected.size !== 1) return;
    const [id, kind] = [...selected.entries()][0];
    const item = kind === "folder" ? folders.find((f) => f.id === id) : assets.find((a) => a.id === id);
    if (!item) return;
    const wasFav = Favorites.has(id);
    Favorites.toggle({ id, kind, name: item.name });
    toast.success(wasFav ? "Removed from favorites" : "Added to favorites");
  };

  const handleAddToSidebarSelected = async () => {
    const folderTargets = [...selected.entries()].filter(([, k]) => k === "folder").map(([id]) => id);
    if (folderTargets.length === 0) {
      toast.error("Select at least one folder");
      return;
    }
    try {
      for (const id of folderTargets) await togglePinFolder(id);
      toast.success(`Sidebar updated (${folderTargets.length})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pin failed");
    }
  };

  /** Move selected items into a destination folder (drag-drop). */
  const handleMoveTo = async (destFolderId: string | null, items: { id: string; kind: "folder" | "asset" }[]) => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      await pasteClipboard(items, "cut", destFolderId);
      toast.success(`Moved ${items.length} item(s)`);
      clear();
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    } finally {
      setBusy(false);
    }
  };

  const canAddToSidebarSel = useMemo(
    () => [...selected.entries()].some(([, k]) => k === "folder"),
    [selected],
  );

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
      const target = ctx!.target!;
      const isFolderTarget = target.kind === "folder";
      const isFav = Favorites.has(target.id);
      return [
        ...(isFolderTarget
          ? [{ label: "Open", icon: <FolderPlus size={14} />, onClick: () => navigate(target.id) }]
          : [{ label: "Open", icon: <ArrowsOut size={14} />, onClick: () => {
              const a = assets.find((x) => x.id === target.id);
              if (a) setPreviewQueue({ items: [a], start: 0 });
            } }]),
        ...(onlyAsset || target.kind === "asset"
          ? [{ label: sel > 1 ? `Preview (${sel})` : "Preview", icon: <Eye size={14} />, onClick: handlePreview }]
          : [{ label: "Bulk preview", icon: <Eye size={14} />, onClick: handlePreview }]),
        { label: sel > 1 ? `Download (${sel})` : "Download", icon: <DownloadSimple size={14} />, onClick: handleDownload },
        { separator: true } as MenuItem,
        ...(sel === 1
          ? [{
              label: isFav ? "Remove favorite" : "Add to favorites",
              icon: <Star size={14} weight={isFav ? "fill" : "regular"} />,
              onClick: handleFavoriteSelected,
            } as MenuItem]
          : []),
        ...(isFolderTarget && isEditorMode
          ? [{
              label: "Add to sidebar",
              icon: <PushPin size={14} />,
              onClick: handleAddToSidebarSelected,
            } as MenuItem]
          : []),
        { label: "Copy", icon: <Copy size={14} />, onClick: handleCopy },
        ...(isEditorMode
          ? ([
              { label: "Cut", icon: <Scissors size={14} />, onClick: handleCut },
              {
                label: clipboard && clipboard.items.length ? `Paste (${clipboard.items.length})` : "Paste",
                icon: <ClipboardText size={14} />,
                onClick: handlePaste,
                disabled: !clipboard || clipboard.items.length === 0,
              },
              ...(sel === 1
                ? [{ label: "Rename", icon: <PencilSimple size={14} />, onClick: () => startRename([...selected.keys()][0]) }]
                : []),
            ] as MenuItem[])
          : []),
        ...(sel === 1
          ? [{ label: "Info", icon: <Info size={14} />, onClick: () => showInfoFor(target) } as MenuItem]
          : []),
        ...(isEditorMode
          ? ([
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

  // Resolve info dialog content
  const renderInfoDialog = () => {
    if (!info) return null;
    if (info.kind === "asset") {
      const a = assets.find((x) => x.id === info.id);
      if (!a) return null;
      return <AssetInfoDialog asset={a} onClose={() => setInfo(null)} />;
    }
    const f = folders.find((x) => x.id === info.id);
    if (!f) return null;
    return <FolderInfo folderId={f.id} folderName={f.name} createdAt={f.created_at} onClose={() => setInfo(null)} />;
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
      isEditorMode={isEditorMode}
      onMoveTo={handleMoveTo}
    />
  );

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <VaultSidebar
        isEditorMode={isEditorMode}
        currentFolderId={folderId}
        onNavigateFolder={(id) => {
          // Navigate clearing history forward
          clear();
          setFolderId(id);
          setHistory((h) => [...h.slice(0, histIdx + 1), id]);
          setHistIdx((i) => i + 1);
        }}
      />


      <div className="md:pl-64">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/85 border-b border-vault-hairline">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 shrink-0 md:hidden">
              <div className="w-2 h-2 rounded-full bg-vault-fg" />
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
            <ThemeToggle />
            {isEditorMode && (
              <span className="shrink-0 hidden sm:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-vault-hairline text-vault-fg-muted">
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
              className="w-full h-8 px-3 bg-vault-overlay border border-vault-hairline rounded-md text-xs text-vault-fg placeholder:text-vault-fg-muted outline-none"
            />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28">
          <FolderInfoBanner folderId={folderId} isEditorMode={isEditorMode} />

          {loading ? (
            <div className="text-vault-fg-muted text-sm py-32 text-center">Loading…</div>
          ) : isEditorMode ? (
            <UploadDropZone currentFolderId={folderId} onUploaded={refresh}>
              {grid}
            </UploadDropZone>
          ) : (
            grid
          )}

          <CommentSection folderId={folderId} isEditorMode={isEditorMode} />
        </main>
      </div>

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
        onInfo={showInfoForSelected}
        onFavorite={handleFavoriteSelected}
        onAddToSidebar={handleAddToSidebarSelected}
        canAddToSidebar={canAddToSidebarSel}
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

      {renderInfoDialog()}


      <UploadProgress />
    </div>
  );
}

/** Loads child counts then renders the FolderInfoDialog. */
function FolderInfo({ folderId, folderName, createdAt, onClose }: { folderId: string; folderName: string; createdAt?: string; onClose: () => void }) {
  const [counts, setCounts] = useState<{ folders: number; assets: number } | null>(null);
  useEffect(() => {
    void (async () => {
      const [{ count: fc }, { count: ac }] = await Promise.all([
        supabase.from("folders").select("id", { count: "exact", head: true }).eq("parent_id", folderId),
        supabase.from("assets").select("id", { count: "exact", head: true }).eq("folder_id", folderId),
      ]);
      setCounts({ folders: fc ?? 0, assets: ac ?? 0 });
    })();
  }, [folderId]);
  return (
    <FolderInfoDialog
      folderId={folderId}
      folderName={folderName}
      createdAt={createdAt}
      childFolders={counts?.folders ?? 0}
      childAssets={counts?.assets ?? 0}
      onClose={onClose}
    />
  );
}

import { useRef, useState } from "react";
import { Folder as FolderIcon, FileText, FilmSlate, Image as ImageIcon, MusicNote, Check, Info } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { getPublicUrl, type Asset, type Folder } from "@/hooks/useFileSystem";

export interface DragItem { id: string; kind: "folder" | "asset" }

interface Props {
  folders: Folder[];
  assets: Asset[];
  onOpenFolder: (id: string) => void;
  onOpenAsset: (asset: Asset) => void;
  onContextMenu: (e: React.MouseEvent, target: { id: string; kind: "folder" | "asset" }) => void;
  onEmptyContextMenu: (e: React.MouseEvent) => void;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (s: string) => void;
  commitRename: () => void;
  cancelRename: () => void;
  cutIds: Set<string>;
  isEditorMode?: boolean;
  onMoveTo?: (destFolderId: string, items: DragItem[]) => void;
  /** Editor-only: triggered after a 600ms left-mouse hold on a tile. */
  onLongPressMove?: (target: { id: string; kind: "folder" | "asset" }) => void;
}

function fileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return FilmSlate;
  if (type.startsWith("audio/")) return MusicNote;
  return FileText;
}
const isImage = (t: string | null) => t?.startsWith("image/") ?? false;

function Checkbox({ checked, onClick }: { checked: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={checked ? "Deselect" : "Select"}
      className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-[4px] flex items-center justify-center transition-all ${
        checked
          ? "bg-vault-fg border border-vault-fg opacity-100"
          : "bg-vault-overlay-strong border border-vault-hairline opacity-0 group-hover:opacity-100"
      }`}
    >
      {checked && <Check size={13} weight="bold" className="text-vault-bg" />}
    </button>
  );
}

function RenameInput({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (s: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onBlur={onCommit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onCommit();
        if (e.key === "Escape") onCancel();
      }}
      className="w-full text-xs text-center bg-vault-bg border border-vault-fg/40 rounded px-1 py-0.5 text-vault-fg outline-none"
    />
  );
}

/** Detect coarse pointer (mobile/tablet) */
function isCoarse(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Hook for long-press → context menu on touch devices. */
function useLongPress(onLong: (e: React.MouseEvent) => void) {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const start = (e: React.TouchEvent) => {
    triggered.current = false;
    const touch = e.touches[0];
    const x = touch.clientX, y = touch.clientY;
    const target = e.currentTarget as HTMLElement;
    timer.current = window.setTimeout(() => {
      triggered.current = true;
      onLong({
        clientX: x, clientY: y, preventDefault: () => {}, stopPropagation: () => {}, currentTarget: target,
      } as unknown as React.MouseEvent);
    }, 500);
  };
  const cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };
  return { onTouchStart: start, onTouchEnd: cancel, onTouchMove: cancel, didTrigger: () => triggered.current };
}

/** Mouse long-press hook (left-button hold for `ms`). Cancels on move/up/leave. */
function useMouseLongPress(onLong: () => void, ms = 600, enabled = true) {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    startPos.current = null;
  };

  return {
    didTrigger: () => triggered.current,
    reset: () => { triggered.current = false; },
    handlers: enabled
      ? {
          onMouseDown: (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            triggered.current = false;
            startPos.current = { x: e.clientX, y: e.clientY };
            timer.current = window.setTimeout(() => {
              triggered.current = true;
              onLong();
            }, ms);
          },
          onMouseMove: (e: React.MouseEvent) => {
            if (!startPos.current) return;
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            if (dx * dx + dy * dy > 36) cancel(); // moved >6px → cancel
          },
          onMouseUp: cancel,
          onMouseLeave: cancel,
        }
      : {},
  };
}

export function FolderGrid({
  folders,
  assets,
  onOpenFolder,
  onOpenAsset,
  onContextMenu,
  onEmptyContextMenu,
  renamingId,
  renameValue,
  setRenameValue,
  commitRename,
  cancelRename,
  cutIds,
  isEditorMode = false,
  onMoveTo,
  onLongPressMove,
}: Props) {
  const { selected, toggle, selectOnly, clear } = useVaultStore();
  const coarse = isCoarse();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleItemClick = (e: React.MouseEvent, id: string, kind: "folder" | "asset", openOnTap: () => void) => {
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggle(id, kind);
      return;
    }
    if (coarse && selected.size === 0) {
      openOnTap();
      return;
    }
    selectOnly(id, kind);
  };

  /** Build the list of items being dragged: selection (if dragged item is selected) else just dragged. */
  const buildDragPayload = (id: string, kind: "folder" | "asset"): DragItem[] => {
    if (selected.has(id) && selected.size > 1) {
      return [...selected.entries()].map(([i, k]) => ({ id: i, kind: k }));
    }
    return [{ id, kind }];
  };

  const dragHandlers = (id: string, kind: "folder" | "asset") =>
    isEditorMode && onMoveTo
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            const payload = buildDragPayload(id, kind);
            e.dataTransfer.setData("application/x-vault-items", JSON.stringify(payload));
            e.dataTransfer.effectAllowed = "move";
          },
        }
      : {};

  const dropHandlers = (folderId: string) =>
    isEditorMode && onMoveTo
      ? {
          onDragOver: (e: React.DragEvent) => {
            if (!e.dataTransfer.types.includes("application/x-vault-items")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTargetId !== folderId) setDropTargetId(folderId);
          },
          onDragLeave: () => {
            if (dropTargetId === folderId) setDropTargetId(null);
          },
          onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDropTargetId(null);
            const raw = e.dataTransfer.getData("application/x-vault-items");
            if (!raw) return;
            try {
              const items = JSON.parse(raw) as DragItem[];
              // Don't drop a folder onto itself
              const filtered = items.filter((it) => !(it.kind === "folder" && it.id === folderId));
              if (filtered.length === 0) return;
              onMoveTo!(folderId, filtered);
            } catch {
              /* noop */
            }
          },
        }
      : {};

  // Split assets — info file pinned first
  const infoAsset = assets.find((a) => a.is_info);
  const otherAssets = assets.filter((a) => !a.is_info);

  if (folders.length === 0 && assets.length === 0) {
    return (
      <div
        onClick={clear}
        onContextMenu={onEmptyContextMenu}
        className="flex flex-col items-center justify-center py-32 text-vault-fg-muted min-h-[60vh]"
      >
        <FolderIcon size={56} weight="duotone" className="opacity-30 mb-4" />
        <p className="text-sm">This folder is empty</p>
        <p className="text-xs mt-1 opacity-70">Right-click for options</p>
      </div>
    );
  }

  return (
    <div onClick={clear} onContextMenu={onEmptyContextMenu} className="min-h-[60vh] space-y-4">
      {infoAsset && (
        <InfoTile
          asset={infoAsset}
          isSelected={selected.has(infoAsset.id)}
          isCut={cutIds.has(infoAsset.id)}
          onClick={(e) => handleItemClick(e, infoAsset.id, "asset", () => onOpenAsset(infoAsset))}
          onDoubleClick={(e) => { e.stopPropagation(); onOpenAsset(infoAsset); }}
          onContextMenu={(e) => onContextMenu(e, { id: infoAsset.id, kind: "asset" })}
          onCheckbox={(e) => { e.stopPropagation(); toggle(infoAsset.id, "asset"); }}
          renaming={renamingId === infoAsset.id}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          cancelRename={cancelRename}
        />
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 sm:gap-3">
        {folders.map((f) => (
          <FolderTile
            key={f.id}
            folder={f}
            isSelected={selected.has(f.id)}
            isCut={cutIds.has(f.id)}
            isDropTarget={dropTargetId === f.id}
            dragProps={dragHandlers(f.id, "folder")}
            dropProps={dropHandlers(f.id)}
            onClick={(e) => handleItemClick(e, f.id, "folder", () => onOpenFolder(f.id))}
            onDoubleClick={(e) => { e.stopPropagation(); onOpenFolder(f.id); }}
            onContextMenu={(e) => onContextMenu(e, { id: f.id, kind: "folder" })}
            onCheckbox={(e) => { e.stopPropagation(); toggle(f.id, "folder"); }}
            renaming={renamingId === f.id}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            commitRename={commitRename}
            cancelRename={cancelRename}
            onLongPressMove={isEditorMode && onLongPressMove ? () => onLongPressMove({ id: f.id, kind: "folder" }) : undefined}
          />
        ))}

        {otherAssets.map((a) => (
          <AssetTile
            key={a.id}
            asset={a}
            isSelected={selected.has(a.id)}
            isCut={cutIds.has(a.id)}
            dragProps={dragHandlers(a.id, "asset")}
            onClick={(e) => handleItemClick(e, a.id, "asset", () => onOpenAsset(a))}
            onDoubleClick={(e) => { e.stopPropagation(); onOpenAsset(a); }}
            onContextMenu={(e) => onContextMenu(e, { id: a.id, kind: "asset" })}
            onCheckbox={(e) => { e.stopPropagation(); toggle(a.id, "asset"); }}
            renaming={renamingId === a.id}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            commitRename={commitRename}
            cancelRename={cancelRename}
            onLongPressMove={isEditorMode && onLongPressMove ? () => onLongPressMove({ id: a.id, kind: "asset" }) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

interface TileBaseProps {
  isSelected: boolean;
  isCut: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCheckbox: (e: React.MouseEvent) => void;
  renaming: boolean;
  renameValue: string;
  setRenameValue: (s: string) => void;
  commitRename: () => void;
  cancelRename: () => void;
}

interface DnDExtras {
  isDropTarget?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  onLongPressMove?: () => void;
}

function FolderTile({ folder: f, isSelected, isCut, isDropTarget, dragProps, dropProps, onClick, onDoubleClick, onContextMenu, onCheckbox, renaming, renameValue, setRenameValue, commitRename, cancelRename }: TileBaseProps & DnDExtras & { folder: Folder }) {
  const lp = useLongPress(onContextMenu);
  return (
    <div
      {...dragProps}
      {...dropProps}
      onClick={(e) => { if (lp.didTrigger()) return; onClick(e); }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onTouchStart={lp.onTouchStart}
      onTouchEnd={lp.onTouchEnd}
      onTouchMove={lp.onTouchMove}
      className={`group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong border transition-colors cursor-pointer select-none ${
        isDropTarget
          ? "border-vault-accent ring-2 ring-vault-accent/40 bg-vault-overlay-strong"
          : isSelected
          ? "border-vault-fg/40 bg-vault-overlay-strong"
          : "border-vault-hairline/50"
      } ${isCut ? "opacity-50" : ""}`}
    >
      <Checkbox checked={isSelected} onClick={onCheckbox} />
      <FolderIcon size={40} weight="fill" className="text-vault-folder" />
      <div className="w-full">
        {renaming ? (
          <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={cancelRename} />
        ) : (
          <span className="block text-xs text-vault-fg truncate text-center">{f.name}</span>
        )}
      </div>
    </div>
  );
}

function AssetTile({ asset: a, isSelected, isCut, dragProps, onClick, onDoubleClick, onContextMenu, onCheckbox, renaming, renameValue, setRenameValue, commitRename, cancelRename }: TileBaseProps & DnDExtras & { asset: Asset }) {
  const Icon = fileIcon(a.file_type);
  const url = getPublicUrl(a.storage_path);
  const lp = useLongPress(onContextMenu);
  return (
    <div
      {...dragProps}
      onClick={(e) => { if (lp.didTrigger()) return; onClick(e); }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onTouchStart={lp.onTouchStart}
      onTouchEnd={lp.onTouchEnd}
      onTouchMove={lp.onTouchMove}
      className={`group relative flex flex-col rounded-md overflow-hidden bg-vault-overlay hover:bg-vault-overlay-strong border transition-colors cursor-pointer select-none ${
        isSelected ? "border-vault-fg/40" : "border-vault-hairline/50"
      } ${isCut ? "opacity-50" : ""}`}
    >
      <Checkbox checked={isSelected} onClick={onCheckbox} />
      <div className="aspect-video bg-vault-bg flex items-center justify-center overflow-hidden">
        {isImage(a.file_type) ? (
          <img src={url} alt={a.name} className="w-full h-full object-cover" loading="lazy" draggable={false} />
        ) : (
          <Icon size={30} weight="light" className="text-vault-fg-muted" />
        )}
      </div>
      <div className="px-2 py-1.5 text-xs text-vault-fg text-center border-t border-vault-hairline/50">
        {renaming ? (
          <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={cancelRename} />
        ) : (
          <span className="block truncate">{a.name}</span>
        )}
      </div>
    </div>
  );
}

function InfoTile({ asset: a, isSelected, isCut, onClick, onDoubleClick, onContextMenu, onCheckbox, renaming, renameValue, setRenameValue, commitRename, cancelRename }: TileBaseProps & { asset: Asset }) {
  const lp = useLongPress(onContextMenu);
  return (
    <div
      onClick={(e) => { if (lp.didTrigger()) return; onClick(e); }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onTouchStart={lp.onTouchStart}
      onTouchEnd={lp.onTouchEnd}
      onTouchMove={lp.onTouchMove}
      className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-lg bg-vault-overlay-strong hover:bg-vault-card-hover border transition-colors cursor-pointer select-none ${
        isSelected ? "border-vault-fg/40" : "border-vault-hairline"
      } ${isCut ? "opacity-50" : ""}`}
    >
      <Checkbox checked={isSelected} onClick={onCheckbox} />
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-vault-accent/15 flex items-center justify-center shrink-0 ml-6">
        <Info size={28} weight="duotone" className="text-vault-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-vault-fg-muted mb-0.5">Folder Info</div>
        {renaming ? (
          <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={cancelRename} />
        ) : (
          <div className="text-sm sm:text-base font-medium text-vault-fg truncate">{a.name}</div>
        )}
        <div className="text-xs text-vault-fg-muted mt-0.5">Double-tap to read</div>
      </div>
    </div>
  );
}

import { Folder as FolderIcon, FileText, FilmSlate, Image as ImageIcon, MusicNote, Check } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { getPublicUrl, type Asset, type Folder } from "@/hooks/useFileSystem";

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
          ? "bg-white border border-white opacity-100"
          : "bg-black/60 border border-white/30 opacity-0 group-hover:opacity-100"
      }`}
    >
      {checked && <Check size={13} weight="bold" className="text-black" />}
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
      className="w-full text-xs text-center bg-black border border-white/40 rounded px-1 py-0.5 text-white outline-none"
    />
  );
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
}: Props) {
  const { selected, toggle, selectOnly, clear } = useVaultStore();

  const handleItemClick = (e: React.MouseEvent, id: string, kind: "folder" | "asset") => {
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggle(id, kind);
    } else {
      selectOnly(id, kind);
    }
  };

  if (folders.length === 0 && assets.length === 0) {
    return (
      <div
        onClick={clear}
        onContextMenu={onEmptyContextMenu}
        className="flex flex-col items-center justify-center py-32 text-white/40 min-h-[60vh]"
      >
        <FolderIcon size={56} weight="duotone" className="opacity-30 mb-4" />
        <p className="text-sm">This folder is empty</p>
        <p className="text-xs mt-1 text-white/30">Right-click for options</p>
      </div>
    );
  }

  return (
    <div
      onClick={clear}
      onContextMenu={onEmptyContextMenu}
      className="min-h-[60vh]"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 sm:gap-3">
        {folders.map((f) => {
          const isSel = selected.has(f.id);
          const isCut = cutIds.has(f.id);
          return (
            <div
              key={f.id}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenFolder(f.id);
              }}
              onClick={(e) => handleItemClick(e, f.id, "folder")}
              onContextMenu={(e) => onContextMenu(e, { id: f.id, kind: "folder" })}
              className={`group relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-md bg-white/[0.02] hover:bg-white/[0.05] border transition-colors cursor-pointer select-none ${
                isSel ? "border-white/40 bg-white/[0.08]" : "border-white/5"
              } ${isCut ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(f.id, "folder");
                }}
              />
              <FolderIcon size={44} weight="fill" className="text-white/70" />
              <div className="w-full">
                {renamingId === f.id ? (
                  <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={cancelRename} />
                ) : (
                  <span className="block text-xs text-white/85 truncate text-center">{f.name}</span>
                )}
              </div>
            </div>
          );
        })}

        {assets.map((a) => {
          const Icon = fileIcon(a.file_type);
          const isSel = selected.has(a.id);
          const isCut = cutIds.has(a.id);
          const url = getPublicUrl(a.storage_path);
          return (
            <div
              key={a.id}
              onClick={(e) => handleItemClick(e, a.id, "asset")}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenAsset(a);
              }}
              onContextMenu={(e) => onContextMenu(e, { id: a.id, kind: "asset" })}
              className={`group relative flex flex-col rounded-md overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] border transition-colors cursor-pointer select-none ${
                isSel ? "border-white/40" : "border-white/5"
              } ${isCut ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(a.id, "asset");
                }}
              />
              <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                {isImage(a.file_type) ? (
                  <img src={url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Icon size={32} weight="light" className="text-white/40" />
                )}
              </div>
              <div className="px-2 py-1.5 text-xs text-white/85 text-center border-t border-white/5">
                {renamingId === a.id ? (
                  <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={cancelRename} />
                ) : (
                  <span className="block truncate">{a.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

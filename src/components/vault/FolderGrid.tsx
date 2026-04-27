import { Folder as FolderIcon, FileText, FilmSlate, Image as ImageIcon, MusicNote, Check } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { getPublicUrl, type Asset, type Folder } from "@/hooks/useFileSystem";

interface Props {
  folders: Folder[];
  assets: Asset[];
  onOpenFolder: (id: string) => void;
}

function fileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return FilmSlate;
  if (type.startsWith("audio/")) return MusicNote;
  return FileText;
}

function isImage(type: string | null) {
  return type?.startsWith("image/") ?? false;
}

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

export function FolderGrid({ folders, assets, onOpenFolder }: Props) {
  const { selected, toggle } = useVaultStore();

  if (folders.length === 0 && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-white/40">
        <FolderIcon size={56} weight="duotone" className="opacity-30 mb-4" />
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {folders.map((f) => {
        const isSel = selected.has(f.id);
        return (
          <div
            key={f.id}
            onDoubleClick={() => onOpenFolder(f.id)}
            onClick={() => onOpenFolder(f.id)}
            className={`group relative flex flex-col items-center gap-2 p-5 rounded-md bg-white/[0.02] hover:bg-white/[0.05] border transition-colors cursor-pointer ${
              isSel ? "border-white/40 bg-white/[0.06]" : "border-white/5"
            }`}
          >
            <Checkbox
              checked={isSel}
              onClick={(e) => {
                e.stopPropagation();
                toggle(f.id, "folder");
              }}
            />
            <FolderIcon size={48} weight="fill" className="text-white/70" />
            <span className="text-xs text-white/80 truncate w-full text-center">{f.name}</span>
          </div>
        );
      })}

      {assets.map((a) => {
        const Icon = fileIcon(a.file_type);
        const isSel = selected.has(a.id);
        const url = getPublicUrl(a.storage_path);
        return (
          <div
            key={a.id}
            onClick={(e) => {
              e.stopPropagation();
              toggle(a.id, "asset");
            }}
            className={`group relative flex flex-col rounded-md overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] border transition-colors cursor-pointer ${
              isSel ? "border-white/40" : "border-white/5"
            }`}
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
                <Icon size={36} weight="light" className="text-white/40" />
              )}
            </div>
            <div className="px-2 py-2 text-xs text-white/80 truncate text-center border-t border-white/5">
              {a.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

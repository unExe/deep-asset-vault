import {
  FolderSimple,
  CheckCircle,
  FileText,
  FilmSlate,
  Image as ImageIcon,
  MusicNote,
} from "@phosphor-icons/react";
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

export function FolderGrid({ folders, assets, onOpenFolder }: Props) {
  const { selected, toggle } = useVaultStore();

  if (folders.length === 0 && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-vault-fg-muted">
        <FolderSimple size={64} weight="duotone" className="opacity-30 mb-4" />
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {folders.map((f) => (
        <button
          key={f.id}
          onDoubleClick={() => onOpenFolder(f.id)}
          onClick={() => onOpenFolder(f.id)}
          className="group flex flex-col items-center gap-2 p-4 rounded-lg bg-vault-card hover:bg-vault-card-hover transition-colors text-left"
        >
          <FolderSimple
            size={56}
            weight="fill"
            className="text-vault-folder group-hover:scale-105 transition-transform"
          />
          <span className="text-xs text-vault-fg truncate w-full text-center">
            {f.name}
          </span>
        </button>
      ))}

      {assets.map((a) => {
        const Icon = fileIcon(a.file_type);
        const isSel = selected.has(a.id);
        const url = getPublicUrl(a.storage_path);
        return (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className={`group relative flex flex-col rounded-lg overflow-hidden bg-vault-card hover:bg-vault-card-hover transition-all ${
              isSel ? "ring-2 ring-vault-accent" : "ring-1 ring-transparent"
            }`}
          >
            <div className="aspect-video bg-black/40 flex items-center justify-center overflow-hidden">
              {isImage(a.file_type) ? (
                <img
                  src={url}
                  alt={a.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Icon size={40} weight="light" className="text-vault-fg-muted" />
              )}
            </div>
            <div className="px-2 py-1.5 text-xs text-vault-fg truncate text-center">
              {a.name}
            </div>
            {isSel && (
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
                <CheckCircle size={22} weight="fill" className="text-vault-accent drop-shadow-lg" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

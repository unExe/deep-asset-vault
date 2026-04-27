import { X, DownloadSimple, Info } from "@phosphor-icons/react";
import { type Asset } from "@/hooks/useFileSystem";

interface Props {
  asset: Asset;
  onClose: () => void;
}

function formatBytes(b: number | null) {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function InfoDialog({
  title,
  rows,
  onClose,
}: {
  title: string;
  rows: { label: string; value: React.ReactNode }[];
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-vault-menu-bg border border-vault-hairline shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-vault-hairline">
          <div className="flex items-center gap-2 text-sm text-vault-fg font-medium">
            <Info size={16} /> {title}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted">
            <X size={14} />
          </button>
        </div>
        <dl className="px-4 py-3 space-y-2 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[110px_1fr] gap-3 items-start">
              <dt className="text-vault-fg-muted uppercase tracking-wider text-[10px] mt-0.5">{r.label}</dt>
              <dd className="text-vault-fg break-all">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function AssetInfoDialog({ asset, onClose }: Props) {
  return (
    <InfoDialog
      title="File info"
      onClose={onClose}
      rows={[
        { label: "Name", value: asset.name },
        { label: "Type", value: asset.file_type ?? "—" },
        { label: "Size", value: formatBytes(asset.size_bytes) },
        { label: "ID", value: <span className="font-mono text-[10px]">{asset.id}</span> },
        { label: "Path", value: <span className="font-mono text-[10px]">{asset.storage_path}</span> },
      ]}
    />
  );
}

export function FolderInfoDialog({
  folderName,
  folderId,
  childFolders,
  childAssets,
  onClose,
}: {
  folderName: string;
  folderId: string;
  childFolders: number;
  childAssets: number;
  onClose: () => void;
}) {
  return (
    <InfoDialog
      title="Folder info"
      onClose={onClose}
      rows={[
        { label: "Name", value: folderName },
        { label: "Subfolders", value: childFolders },
        { label: "Files", value: childAssets },
        { label: "ID", value: <span className="font-mono text-[10px]">{folderId}</span> },
      ]}
    />
  );
}

export { formatBytes };

// Re-export the icon for the action bar
export const DownloadInfoIcons = { DownloadSimple, Info };

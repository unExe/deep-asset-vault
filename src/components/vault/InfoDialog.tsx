import { X, DownloadSimple, Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { type Asset } from "@/hooks/useFileSystem";
import { supabase } from "@/integrations/supabase/client";
import { getEventCounts } from "@/lib/visitor";

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

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

/** Build "/A/B/C" path string from folder id. */
async function buildPath(folderId: string | null): Promise<string> {
  if (!folderId) return "/";
  const trail: string[] = [];
  let cursor: string | null = folderId;
  while (cursor) {
    const { data } = await supabase
      .from("folders")
      .select("name,parent_id")
      .eq("id", cursor)
      .maybeSingle();
    const row = data as { name: string; parent_id: string | null } | null;
    if (!row) break;
    trail.unshift(row.name);
    cursor = row.parent_id;
  }
  return "/" + trail.join("/");
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
        <dl className="px-4 py-3 space-y-2 text-xs max-h-[70vh] overflow-y-auto">
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
  const [path, setPath] = useState<string>("…");
  const [counts, setCounts] = useState<{ views: number; downloads: number } | null>(null);

  useEffect(() => {
    void buildPath(asset.folder_id).then((p) => setPath(p + (p.endsWith("/") ? "" : "/") + asset.name));
    void getEventCounts(asset.id).then(setCounts);
  }, [asset.folder_id, asset.id, asset.name]);

  return (
    <InfoDialog
      title="File info"
      onClose={onClose}
      rows={[
        { label: "Name", value: asset.name },
        { label: "Date uploaded", value: fmtDate(asset.created_at) },
        { label: "Date edited", value: fmtDate(asset.updated_at) },
        { label: "Type", value: asset.file_type ?? "—" },
        { label: "Size", value: formatBytes(asset.size_bytes) },
        { label: "ID", value: <span className="font-mono text-[10px]">{asset.id}</span> },
        { label: "Path", value: <span className="font-mono text-[10px]">{path}</span> },
        { label: "People viewed", value: counts ? counts.views : "…" },
        { label: "People downloaded", value: counts ? counts.downloads : "…" },
      ]}
    />
  );
}

export function FolderInfoDialog({
  folderName,
  folderId,
  childFolders,
  childAssets,
  createdAt,
  onClose,
}: {
  folderName: string;
  folderId: string;
  childFolders: number;
  childAssets: number;
  createdAt?: string;
  onClose: () => void;
}) {
  const [path, setPath] = useState<string>("…");
  useEffect(() => {
    void buildPath(folderId).then(setPath);
  }, [folderId]);
  return (
    <InfoDialog
      title="Folder info"
      onClose={onClose}
      rows={[
        { label: "Name", value: folderName },
        { label: "Date created", value: fmtDate(createdAt) },
        { label: "Type", value: "Folder" },
        { label: "Subfolders", value: childFolders },
        { label: "Files", value: childAssets },
        { label: "ID", value: <span className="font-mono text-[10px]">{folderId}</span> },
        { label: "Path", value: <span className="font-mono text-[10px]">{path}</span> },
      ]}
    />
  );
}

export { formatBytes };
export const DownloadInfoIcons = { DownloadSimple, Info };

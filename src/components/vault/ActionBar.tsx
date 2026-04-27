import { Eye, DownloadSimple, Trash, X } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { getPublicUrl, type Asset } from "@/hooks/useFileSystem";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  assets: Asset[];
  isEditorMode: boolean;
  onChanged: () => void;
  onPreview: (asset: Asset) => void;
}

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
}

async function collectFolderContents(
  folderId: string,
  prefix: string,
): Promise<{ path: string; storage_path: string; name: string }[]> {
  const out: { path: string; storage_path: string; name: string }[] = [];
  const { data: folderRow } = await supabase
    .from("folders")
    .select("name")
    .eq("id", folderId)
    .maybeSingle();
  const folderName = (folderRow as { name: string } | null)?.name ?? "folder";
  const here = `${prefix}${folderName}/`;

  const { data: files } = await supabase
    .from("assets")
    .select("name,storage_path")
    .eq("folder_id", folderId);
  for (const f of (files as { name: string; storage_path: string }[] | null) ?? []) {
    out.push({ path: `${here}${f.name}`, storage_path: f.storage_path, name: f.name });
  }

  const { data: subs } = await supabase
    .from("folders")
    .select("id,name,parent_id")
    .eq("parent_id", folderId);
  for (const s of (subs as FolderRow[] | null) ?? []) {
    const nested = await collectFolderContents(s.id, here);
    out.push(...nested);
  }
  return out;
}

export function ActionBar({ assets, isEditorMode, onChanged, onPreview }: Props) {
  const { selected, clear } = useVaultStore();
  const [busy, setBusy] = useState(false);

  if (selected.size === 0) return null;

  const selectedAssets = assets.filter((a) => selected.get(a.id) === "asset");
  const selectedFolderIds = [...selected.entries()]
    .filter(([, k]) => k === "folder")
    .map(([id]) => id);

  const totalCount = selected.size;
  const isSinglePreviewable = totalCount === 1 && selectedAssets.length === 1;

  const handleDownload = async () => {
    setBusy(true);
    try {
      // Single file → direct download, no zip
      if (totalCount === 1 && selectedAssets.length === 1 && selectedFolderIds.length === 0) {
        const a = selectedAssets[0];
        const blob = await fetch(getPublicUrl(a.storage_path)).then((r) => r.blob());
        triggerDownload(blob, a.name);
      } else {
        const zip = new JSZip();
        // top-level assets
        await Promise.all(
          selectedAssets.map(async (a) => {
            const blob = await fetch(getPublicUrl(a.storage_path)).then((r) => r.blob());
            zip.file(a.name, blob);
          }),
        );
        // folders (recursively)
        for (const fid of selectedFolderIds) {
          const items = await collectFolderContents(fid, "");
          await Promise.all(
            items.map(async (it) => {
              const blob = await fetch(getPublicUrl(it.storage_path)).then((r) => r.blob());
              zip.file(it.path, blob);
            }),
          );
        }
        const out = await zip.generateAsync({ type: "blob" });
        triggerDownload(out, `assetvault-${Date.now()}.zip`);
      }
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${totalCount} item(s)?`)) return;
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
      onChanged();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 bg-black border border-white/15 rounded-full shadow-2xl">
      <span className="px-3 text-xs text-white/60 tabular-nums">{totalCount} selected</span>
      <div className="w-px h-5 bg-white/10" />
      {isSinglePreviewable && (
        <button
          onClick={() => onPreview(selectedAssets[0])}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors"
        >
          <Eye size={16} weight="regular" /> Preview
        </button>
      )}
      <button
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm text-white transition-colors disabled:opacity-50"
      >
        <DownloadSimple size={16} weight="regular" /> {busy ? "Preparing…" : "Download"}
      </button>
      {isEditorMode && (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-500/20 text-sm text-red-400 transition-colors disabled:opacity-50"
        >
          <Trash size={16} weight="regular" /> Delete
        </button>
      )}
      <div className="w-px h-5 bg-white/10" />
      <button
        onClick={clear}
        aria-label="Clear selection"
        className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

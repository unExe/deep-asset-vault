import { Eye, DownloadSimple, Trash, X } from "@phosphor-icons/react";
import { useVaultStore } from "@/lib/vault-store";
import { getPublicUrl, type Asset } from "@/hooks/useFileSystem";
import JSZip from "jszip";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  assets: Asset[];
  isEditorMode: boolean;
  onChanged: () => void;
  onPreview: (asset: Asset) => void;
}

export function ActionBar({ assets, isEditorMode, onChanged, onPreview }: Props) {
  const { selected, clear } = useVaultStore();
  const [busy, setBusy] = useState(false);
  const selectedAssets = assets.filter((a) => selected.has(a.id));

  if (selectedAssets.length === 0) return null;

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (selectedAssets.length === 1) {
        const a = selectedAssets[0];
        const url = getPublicUrl(a.storage_path);
        const blob = await fetch(url).then((r) => r.blob());
        triggerDownload(blob, a.name);
      } else {
        const zip = new JSZip();
        await Promise.all(
          selectedAssets.map(async (a) => {
            const blob = await fetch(getPublicUrl(a.storage_path)).then((r) => r.blob());
            zip.file(a.name, blob);
          }),
        );
        const out = await zip.generateAsync({ type: "blob" });
        triggerDownload(out, `assetvault-${Date.now()}.zip`);
      }
      toast.success("Download started");
    } catch (e) {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = () => {
    if (selectedAssets[0]) onPreview(selectedAssets[0]);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedAssets.length} item(s)?`)) return;
    setBusy(true);
    try {
      const paths = selectedAssets.map((a) => a.storage_path);
      await supabase.storage.from("assets").remove(paths);
      await supabase.from("assets").delete().in("id", selectedAssets.map((a) => a.id));
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-2 bg-vault-card border border-vault-border rounded-full shadow-2xl backdrop-blur-xl">
      <span className="px-3 text-xs text-vault-fg-muted">{selectedAssets.length} selected</span>
      <div className="w-px h-6 bg-vault-border" />
      <button
        onClick={handlePreview}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-vault-card-hover text-sm text-vault-fg transition-colors"
      >
        <Eye size={18} weight="regular" /> Preview
      </button>
      <button
        onClick={handleDownload}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-vault-card-hover text-sm text-vault-fg transition-colors disabled:opacity-50"
      >
        <DownloadSimple size={18} weight="regular" /> Download
      </button>
      {isEditorMode && (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-destructive/20 text-sm text-destructive transition-colors disabled:opacity-50"
        >
          <Trash size={18} weight="regular" /> Delete
        </button>
      )}
      <div className="w-px h-6 bg-vault-border" />
      <button
        onClick={clear}
        className="p-2 rounded-full hover:bg-vault-card-hover text-vault-fg-muted"
      >
        <X size={16} />
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

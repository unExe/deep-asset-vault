import { useState } from "react";
import { Breadcrumbs } from "@/components/vault/Breadcrumbs";
import { FolderGrid } from "@/components/vault/FolderGrid";
import { ActionBar } from "@/components/vault/ActionBar";
import { PreviewModal } from "@/components/vault/PreviewModal";
import { UploadDropZone } from "@/components/vault/UploadDropZone";
import { useFileSystem, type Asset } from "@/hooks/useFileSystem";
import { useVaultStore } from "@/lib/vault-store";

export function AssetVaultApp({ isEditorMode }: { isEditorMode: boolean }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Asset | null>(null);
  const { folders, assets, loading, refresh } = useFileSystem(folderId);
  const { selected, clear } = useVaultStore();

  const navigate = (id: string | null) => {
    clear();
    setFolderId(id);
  };

  const grid = <FolderGrid folders={folders} assets={assets} onOpenFolder={navigate} />;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="font-medium tracking-tight text-sm">AssetVault</span>
          </div>
          <div className="flex-1 min-w-0">
            <Breadcrumbs
              folderId={folderId}
              onNavigate={navigate}
              selectedCount={selected.size}
            />
          </div>
          {isEditorMode && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/20 text-white/70">
              Editor
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
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
        onChanged={refresh}
        onPreview={setPreview}
      />
      <PreviewModal asset={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

import { useState } from "react";
import { Breadcrumbs } from "@/components/vault/Breadcrumbs";
import { FolderGrid } from "@/components/vault/FolderGrid";
import { ActionBar } from "@/components/vault/ActionBar";
import { PreviewModal } from "@/components/vault/PreviewModal";
import { UploadDropZone } from "@/components/vault/UploadDropZone";
import { useFileSystem, type Asset } from "@/hooks/useFileSystem";
import { useVaultStore } from "@/lib/vault-store";
import { LockKey, LockKeyOpen, Vault } from "@phosphor-icons/react";

export function AssetVaultApp({ isEditorMode }: { isEditorMode: boolean }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Asset | null>(null);
  const { folders, assets, loading, refresh } = useFileSystem(folderId);
  const { selected, clear } = useVaultStore();

  const navigate = (id: string | null) => {
    clear();
    setFolderId(id);
  };

  const grid = (
    <FolderGrid folders={folders} assets={assets} onOpenFolder={navigate} />
  );

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-vault-bg/80 border-b border-vault-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-vault-fg shrink-0">
            <Vault size={22} weight="fill" className="text-vault-accent" />
            <span className="font-semibold tracking-tight">AssetVault</span>
          </div>
          <div className="flex-1 min-w-0">
            <Breadcrumbs
              folderId={folderId}
              onNavigate={navigate}
              selectedCount={selected.size}
            />
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-vault-border text-vault-fg-muted">
            {isEditorMode ? (
              <>
                <LockKeyOpen size={12} weight="fill" className="text-vault-accent" />
                <span className="text-vault-accent">Editor</span>
              </>
            ) : (
              <>
                <LockKey size={12} weight="fill" /> Read-only
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-vault-fg-muted text-sm py-32 text-center">Loading…</div>
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

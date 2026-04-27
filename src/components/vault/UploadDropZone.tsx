import { CloudArrowUp, FolderPlus } from "@phosphor-icons/react";
import { useState, type DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  currentFolderId: string | null;
  onUploaded: () => void;
  children: React.ReactNode;
}

export function UploadDropZone({ currentFolderId, onUploaded, children }: Props) {
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const path = `${currentFolderId ?? "root"}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("assets").upload(path, file);
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("assets").insert({
          name: file.name,
          storage_path: path,
          folder_id: currentFolderId,
          file_type: file.type || null,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      }
      toast.success(`Uploaded ${files.length} file(s)`);
      onUploaded();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name?");
    if (!name) return;
    const { error } = await supabase.from("folders").insert({ name, parent_id: currentFolderId });
    if (error) toast.error(error.message);
    else {
      toast.success("Folder created");
      onUploaded();
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className="relative min-h-[60vh]"
    >
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={handleNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-card hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-border"
        >
          <FolderPlus size={14} /> New folder
        </button>
        <span className="text-xs text-vault-fg-muted">
          Drag & drop files anywhere to upload
        </span>
      </div>
      {children}
      {(over || uploading) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-vault-accent/10 border-2 border-dashed border-vault-accent rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-vault-accent">
            <CloudArrowUp size={56} weight="duotone" />
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drop to upload"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { CloudArrowUp } from "@phosphor-icons/react";
import { useState, type DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUploadStore } from "@/lib/upload-store";
import { uploadOne } from "@/lib/vault-upload";
import { aInsert, aUploadFile } from "@/lib/admin-api";
import { storagePath } from "@/lib/admin-api";

interface Props {
  currentFolderId: string | null;
  onUploaded: () => void;
  children: React.ReactNode;
}

export function UploadDropZone({ currentFolderId, onUploaded, children }: Props) {
  const [over, setOver] = useState(false);
  const { add: addUpload, set: setUpload } = useUploadStore();

  const runUploads = async (files: File[]) => {
    let okCount = 0;
    for (const file of files) {
      const id = crypto.randomUUID();
      addUpload(id, file.name);
      setUpload(id, "uploading");
      try {
        await uploadOne(file, currentFolderId);
        setUpload(id, "done");
        okCount++;
      } catch (e: unknown) {
        setUpload(id, "error", e instanceof Error ? e.message : "Failed");
      }
    }
    if (okCount > 0) onUploaded();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    void runUploads(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className="relative"
    >
      {children}
      {over && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-vault-overlay-strong border-2 border-dashed border-vault-fg/30 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-vault-fg">
            <CloudArrowUp size={48} weight="duotone" />
            <p className="text-sm font-medium">Drop to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Create the pinned `_info.txt` file inside `folderId`. */
export async function createInfoFile(folderId: string, folderName: string): Promise<void> {
  const fileName = `${folderName} — info.txt`;
  const content = `# ${folderName}

This is the info file for "${folderName}".
Edit (rename or replace) this file to describe what's inside this folder, who it's for, and any notes editors should know.

— vault.unExe
`;
  const blob = new Blob([content], { type: "text/plain" });
  const path = storagePath(folderId, fileName);
  try {
    await aUploadFile(path, blob, "text/plain");
  } catch {
    return;
  }
  await aInsert("assets", [{
    name: fileName,
    storage_path: path,
    folder_id: folderId,
    file_type: "text/plain",
    size_bytes: blob.size,
    is_info: true,
  }]);
}

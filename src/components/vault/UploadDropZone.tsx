import { CloudArrowUp } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { useUploadStore } from "@/lib/upload-store";
import {
  filesFromDataTransfer,
  runPool,
  uploadFromRelativePath,
  uploadOne,
  type DroppedFile,
} from "@/lib/vault-upload";
import { aInsert, aUploadFile } from "@/lib/admin-api";
import { storagePath } from "@/lib/admin-api";

interface Props {
  currentFolderId: string | null;
  onUploaded: () => void;
  children: React.ReactNode;
}

export function UploadDropZone({ currentFolderId, onUploaded, children }: Props) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const { add: addUpload, set: setUpload } = useUploadStore();

  // Stop the browser from replacing the page when a file lands outside the zone.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const runUploads = async (items: DroppedFile[]) => {
    let okCount = 0;
    let failed = 0;
    await runPool(items, 4, async ({ file, relPath }) => {
      const id = crypto.randomUUID();
      addUpload(id, relPath || file.name);
      setUpload(id, "uploading");
      try {
        if (relPath) await uploadFromRelativePath(file, relPath, currentFolderId);
        else await uploadOne(file, currentFolderId);
        setUpload(id, "done");
        okCount++;
      } catch (e: unknown) {
        failed++;
        setUpload(id, "error", e instanceof Error ? e.message : "Failed");
      }
    });
    if (okCount > 0) {
      toast.success(`Uploaded ${okCount} item(s)${failed ? ` — ${failed} failed` : ""}`);
      onUploaded();
    } else if (failed > 0) {
      toast.error("Upload failed");
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    depth.current = 0;
    setOver(false);
    const items = await filesFromDataTransfer(e.dataTransfer);
    if (items.length === 0) return;
    void runUploads(items);
  };

  const hasFiles = (e: DragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");

  return (
    <div
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => void handleDrop(e)}
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

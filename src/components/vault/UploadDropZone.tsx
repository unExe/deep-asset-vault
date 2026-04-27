import { CloudArrowUp, FolderPlus, Upload, FolderSimplePlus } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureFolder } from "@/hooks/useFileSystem";
import { toast } from "sonner";
import { useUploadStore } from "@/lib/upload-store";

interface Props {
  currentFolderId: string | null;
  onUploaded: () => void;
  children: React.ReactNode;
}

interface FileWithPath extends File {
  webkitRelativePath: string;
}

async function uploadOne(file: File, folderId: string | null) {
  const path = `${folderId ?? "root"}/${crypto.randomUUID()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("assets").upload(path, file);
  if (upErr) throw upErr;
  const { error: insErr } = await supabase.from("assets").insert({
    name: file.name,
    storage_path: path,
    folder_id: folderId,
    file_type: file.type || null,
    size_bytes: file.size,
  });
  if (insErr) throw insErr;
}

async function uploadFromRelativePath(file: File, relPath: string, baseFolderId: string | null) {
  const parts = relPath.split("/").filter(Boolean);
  const folderParts = parts.slice(0, -1);
  let parent = baseFolderId;
  for (const name of folderParts) {
    parent = await ensureFolder(name, parent);
  }
  await uploadOne(file, parent);
}

export function UploadDropZone({ currentFolderId, onUploaded, children }: Props) {
  const [over, setOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { add: addUpload, set: setUpload } = useUploadStore();

  const runUploads = async (
    items: { file: File; relPath?: string }[],
  ) => {
    let okCount = 0;
    for (const { file, relPath } of items) {
      const id = crypto.randomUUID();
      addUpload(id, relPath || file.name);
      setUpload(id, "uploading");
      try {
        if (relPath) {
          await uploadFromRelativePath(file, relPath, currentFolderId);
        } else {
          await uploadOne(file, currentFolderId);
        }
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
    void runUploads(files.map((f) => ({ file: f })));
  };

  const handleFiles = async (fileList: FileList | null, withPaths: boolean) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList) as FileWithPath[];
    void runUploads(files.map((f) => ({ file: f, relPath: withPaths ? f.webkitRelativePath : undefined })));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name?");
    if (!name) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({ name, parent_id: currentFolderId })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Create failed");
      return;
    }
    // Create the pinned info text file inside the new folder
    await createInfoFile((data as { id: string }).id, name);
    toast.success("Folder created");
    onUploaded();
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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline"
        >
          <Upload size={14} /> Import files
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline"
        >
          <FolderSimplePlus size={14} /> Import folder
        </button>
        <button
          onClick={handleNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong text-xs text-vault-fg border border-vault-hairline"
        >
          <FolderPlus size={14} /> New folder
        </button>
        <span className="text-xs text-vault-fg-muted hidden sm:inline">or drag &amp; drop anywhere</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files, false)}
      />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        onChange={(e) => handleFiles(e.target.files, true)}
        // @ts-expect-error - non-standard attributes for folder selection
        webkitdirectory=""
        directory=""
        mozdirectory=""
      />
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
  const path = `${folderId}/${crypto.randomUUID()}-${fileName}`;
  const { error: upErr } = await supabase.storage.from("assets").upload(path, blob, { contentType: "text/plain" });
  if (upErr) return;
  await supabase.from("assets").insert({
    name: fileName,
    storage_path: path,
    folder_id: folderId,
    file_type: "text/plain",
    size_bytes: blob.size,
    is_info: true,
  });
}

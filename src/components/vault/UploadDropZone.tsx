import { CloudArrowUp, FolderPlus, Upload, FolderSimplePlus } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureFolder } from "@/hooks/useFileSystem";
import { toast } from "sonner";

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

/** Given a relative path "A/B/file.ext", create folders and upload. */
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) await uploadOne(file, currentFolderId);
      toast.success(`Uploaded ${files.length} file(s)`);
      onUploaded();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (fileList: FileList | null, withPaths: boolean) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList) as FileWithPath[];
    setUploading(true);
    try {
      for (const f of files) {
        if (withPaths && f.webkitRelativePath) {
          await uploadFromRelativePath(f, f.webkitRelativePath, currentFolderId);
        } else {
          await uploadOne(f, currentFolderId);
        }
      }
      toast.success(`Imported ${files.length} item(s)`);
      onUploaded();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
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
      className="relative"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white border border-white/10"
        >
          <Upload size={14} /> Import files
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white border border-white/10"
        >
          <FolderSimplePlus size={14} /> Import folder
        </button>
        <button
          onClick={handleNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white border border-white/10"
        >
          <FolderPlus size={14} /> New folder
        </button>
        <span className="text-xs text-white/40 hidden sm:inline">or drag &amp; drop anywhere</span>
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
      {(over || uploading) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/5 border-2 border-dashed border-white/30 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-white">
            <CloudArrowUp size={48} weight="duotone" />
            <p className="text-sm font-medium">{uploading ? "Uploading…" : "Drop to upload"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

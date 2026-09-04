import { useRef, useState } from "react";
import {
  X as XIcon,
  Upload,
  FolderSimplePlus,
  GoogleDriveLogo,
  FileArrowUp,
  LinkSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useUploadStore } from "@/lib/upload-store";
import { FILE_TYPE_OPTIONS, runPool, uploadFromRelativePath, uploadOne } from "@/lib/vault-upload";
import { addEmbed, parseDriveFileId, parseDriveFolderId } from "@/lib/gdrive";

type Source = "files" | "folder" | "drive-folder" | "drive-file" | "link";

interface Props {
  currentFolderId: string | null;
  onDone: () => void;
  onClose: () => void;
}

const SOURCES: { id: Source; label: string; icon: React.ReactNode }[] = [
  { id: "files", label: "Files", icon: <Upload size={16} /> },
  { id: "folder", label: "Folder", icon: <FolderSimplePlus size={16} /> },
  { id: "drive-folder", label: "Drive folder", icon: <GoogleDriveLogo size={16} /> },
  { id: "drive-file", label: "Drive file", icon: <FileArrowUp size={16} /> },
  { id: "link", label: "Link", icon: <LinkSimple size={16} /> },
];

export function UploadDialog({ currentFolderId, onDone, onClose }: Props) {
  const [source, setSource] = useState<Source>("files");
  const [useDefaultName, setUseDefaultName] = useState(true);
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState(""); // "" = auto
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { add: addUpload, set: setUpload } = useUploadStore();

  const isFileStep = source === "files" || source === "drive-file";
  const needsLink = source === "drive-folder" || source === "drive-file" || source === "link";
  const nameRequired = source === "drive-folder" || source === "drive-file" || source === "link";
  const customName = useDefaultName ? "" : name.trim();

  const runUploads = async (items: { file: File; relPath?: string }[]) => {
    setBusy(true);
    let ok = 0;
    let failed = 0;
    await runPool(items, 4, async ({ file, relPath }) => {
      const id = crypto.randomUUID();
      addUpload(id, relPath || customName || file.name);
      setUpload(id, "uploading");
      try {
        if (relPath) {
          await uploadFromRelativePath(file, relPath, currentFolderId, customName || undefined);
        } else {
          await uploadOne(file, currentFolderId, {
            name: items.length === 1 ? customName : undefined,
            fileType,
          });
        }
        setUpload(id, "done");
        ok++;
      } catch (e) {
        failed++;
        setUpload(id, "error", e instanceof Error ? e.message : "Failed");
      }
    });
    setBusy(false);
    if (ok > 0) {
      toast.success(`Uploaded ${ok} item(s)${failed ? ` — ${failed} failed` : ""}`);
      onDone();
      onClose();
    } else if (failed > 0) {
      toast.error("Upload failed");
    }
  };

  const handlePicked = (list: FileList | null, withPaths: boolean) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list) as (File & { webkitRelativePath: string })[];
    void runUploads(files.map((f) => ({ file: f, relPath: withPaths ? f.webkitRelativePath : undefined })));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needsLink) {
      (source === "folder" ? folderInputRef : fileInputRef).current?.click();
      return;
    }
    const embedName = useDefaultName ? "" : name.trim();
    setBusy(true);
    try {
      if (source === "drive-folder") {
        const parsed = parseDriveFolderId(link);
        if ("error" in parsed) throw new Error(parsed.error);
        await addEmbed((embedName || "Drive folder").slice(0, 120), parsed.id, currentFolderId, "folder");
      } else if (source === "drive-file") {
        const parsed = parseDriveFileId(link);
        if ("error" in parsed) throw new Error(parsed.error);
        await addEmbed((embedName || "Drive file").slice(0, 120), parsed.id, currentFolderId, "file", fileType || undefined);
      } else {
        const url = link.trim();
        if (!/^https?:\/\//i.test(url)) throw new Error("Enter a full URL starting with http(s)://");
        let fallback = "Link";
        try {
          fallback = new URL(url).hostname.replace(/^www\./, "");
        } catch { /* keep fallback */ }
        await addEmbed((embedName || fallback).slice(0, 120), url, currentFolderId, "link");
      }
      toast.success("Added");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-vault-menu-bg border border-vault-hairline shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-vault-hairline">
          <span className="text-sm font-medium text-vault-fg">Add to this folder</span>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted" aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <span className="block text-[11px] text-vault-fg-muted mb-1.5">Source</span>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] transition-colors ${
                    source === s.id
                      ? "border-vault-fg/50 bg-vault-overlay-strong text-vault-fg"
                      : "border-vault-hairline/60 bg-vault-overlay text-vault-fg-muted hover:text-vault-fg"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {needsLink && (
            <label className="block">
              <span className="block text-[11px] text-vault-fg-muted mb-1">
                {source === "link" ? "URL" : source === "drive-file" ? "Google Drive file link" : "Google Drive folder link"}
              </span>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={source === "link" ? "https://…" : "https://drive.google.com/…"}
                className="w-full h-9 px-2.5 bg-vault-bg border border-vault-hairline rounded text-xs text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-[11px] text-vault-fg-muted cursor-pointer">
            <input
              type="checkbox"
              checked={useDefaultName}
              onChange={(e) => setUseDefaultName(e.target.checked)}
              className="accent-current"
            />
            {nameRequired ? "Use the default name" : "Keep original file/folder names"}
          </label>

          {!useDefaultName && (
            <label className="block">
              <span className="block text-[11px] text-vault-fg-muted mb-1">
                {source === "folder" ? "Folder name" : "Name"}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder={source === "folder" ? "My folder" : "My file"}
                className="w-full h-9 px-2.5 bg-vault-bg border border-vault-hairline rounded text-xs text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40"
              />
            </label>
          )}

          {isFileStep && (
            <label className="block">
              <span className="block text-[11px] text-vault-fg-muted mb-1">File type</span>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full h-9 px-2 bg-vault-bg border border-vault-hairline rounded text-xs text-vault-fg outline-none focus:border-vault-fg/40"
              >
                <option value="">Choose automatically</option>
                {FILE_TYPE_OPTIONS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((it) => (
                      <option key={it.value} value={it.value}>
                        {it.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="text-xs px-3 py-2 rounded bg-vault-fg text-vault-bg disabled:opacity-50"
            >
              {busy ? "Working…" : source === "files" ? "Choose files" : source === "folder" ? "Choose folder" : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
            >
              Cancel
            </button>
          </div>

          {source === "drive-folder" && (
            <p className="text-[11px] text-vault-fg-muted">
              The folder must be shared as “Anyone with the link”. Only the link is stored — no files are copied.
            </p>
          )}
        </form>

        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handlePicked(e.target.files, false)} />
        <input
          ref={folderInputRef}
          type="file"
          hidden
          onChange={(e) => handlePicked(e.target.files, true)}
          // @ts-expect-error - non-standard folder-selection attributes
          webkitdirectory=""
          directory=""
          mozdirectory=""
        />
      </div>
    </div>
  );
}

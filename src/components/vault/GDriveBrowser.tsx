import { useCallback, useEffect, useState } from "react";
import {
  X as XIcon,
  Folder as FolderIcon,
  FileText,
  DownloadSimple,
  ArrowLeft,
  ArrowSquareOut,
  GoogleDriveLogo,
  CaretRight,
} from "@phosphor-icons/react";
import { listDriveFolder, type DriveFile } from "@/lib/gdrive.functions";
import { driveDownloadUrl, drivePreviewUrl, driveFolderUrl, isDriveFolder } from "@/lib/gdrive";

interface Props {
  rootId: string;
  rootName: string;
  onClose: () => void;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export function GDriveBrowser({ rootId, rootName, onClose }: Props) {
  const [trail, setTrail] = useState<{ id: string; name: string }[]>([{ id: rootId, name: rootName }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DriveFile | null>(null);

  const current = trail[trail.length - 1];

  const load = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listDriveFolder({ data: { folderId } });
      setFiles(res.files);
      setError(res.error);
    } catch {
      setError("Couldn't reach Google Drive");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(current.id);
  }, [current.id, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (preview) setPreview(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-vault-hairline bg-vault-menu-bg">
        {trail.length > 1 && (
          <button
            onClick={() => setTrail((t) => t.slice(0, -1))}
            className="p-1.5 rounded hover:bg-vault-overlay-strong text-vault-fg"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <GoogleDriveLogo size={18} className="text-vault-accent shrink-0" />
        <div className="flex items-center gap-0.5 text-xs text-vault-fg-muted overflow-x-auto whitespace-nowrap flex-1 min-w-0">
          {trail.map((t, i) => (
            <div key={t.id} className="flex items-center gap-0.5">
              {i > 0 && <CaretRight size={11} className="opacity-40" />}
              <button
                onClick={() => setTrail((cur) => cur.slice(0, i + 1))}
                className="px-1.5 py-0.5 rounded hover:bg-vault-overlay-strong text-vault-fg"
              >
                {t.name}
              </button>
            </div>
          ))}
        </div>
        <a
          href={driveFolderUrl(current.id)}
          target="_blank"
          rel="noreferrer noopener"
          className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
        >
          <ArrowSquareOut size={13} /> Open in Drive
        </a>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-vault-overlay-strong text-vault-fg" aria-label="Close">
          <XIcon size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-vault-bg px-3 sm:px-5 py-4">
        {loading ? (
          <div className="text-vault-fg-muted text-sm py-24 text-center">Loading Drive folder…</div>
        ) : error ? (
          <div className="text-vault-fg-muted text-sm py-24 text-center">{error}</div>
        ) : files.length === 0 ? (
          <div className="text-vault-fg-muted text-sm py-24 text-center">This Drive folder is empty</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5 sm:gap-3 max-w-7xl mx-auto">
            {files.map((f) =>
              isDriveFolder(f.mimeType) ? (
                <button
                  key={f.id}
                  onClick={() => setTrail((t) => [...t, { id: f.id, name: f.name }])}
                  className="group flex flex-col items-center gap-2 p-4 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong border border-vault-hairline/50 transition-colors"
                >
                  <FolderIcon size={38} weight="fill" className="text-vault-folder" />
                  <span className="text-xs text-vault-fg truncate w-full text-center">{f.name}</span>
                </button>
              ) : (
                <div
                  key={f.id}
                  className="group relative flex flex-col rounded-md overflow-hidden bg-vault-overlay border border-vault-hairline/50"
                >
                  <button
                    onClick={() => setPreview(f)}
                    className="aspect-video bg-vault-bg flex items-center justify-center overflow-hidden w-full"
                  >
                    {f.thumbnailLink ? (
                      <img
                        src={f.thumbnailLink}
                        alt={f.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText size={28} weight="light" className="text-vault-fg-muted" />
                    )}
                  </button>
                  <div className="px-2 py-1.5 border-t border-vault-hairline/50 flex items-center gap-1.5">
                    <span className="text-xs text-vault-fg truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-vault-fg-muted shrink-0">{fmtSize(f.size)}</span>
                    <a
                      href={driveDownloadUrl(f.id)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted shrink-0"
                      aria-label={`Download ${f.name}`}
                    >
                      <DownloadSimple size={13} />
                    </a>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* File preview */}
      {preview && (
        <div className="absolute inset-0 z-10 bg-black/95 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-vault-hairline">
            <span className="text-sm text-vault-fg truncate flex-1">{preview.name}</span>
            <a
              href={driveDownloadUrl(preview.id)}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
            >
              <DownloadSimple size={13} /> Download
            </a>
            <button
              onClick={() => setPreview(null)}
              className="p-1.5 rounded hover:bg-vault-overlay-strong text-vault-fg"
              aria-label="Close preview"
            >
              <XIcon size={18} />
            </button>
          </div>
          <iframe
            src={drivePreviewUrl(preview.id)}
            title={preview.name}
            allow="autoplay"
            className="flex-1 w-full bg-black"
          />
        </div>
      )}
    </div>
  );
}

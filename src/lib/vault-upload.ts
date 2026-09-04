import { ensureFolder } from "@/hooks/useFileSystem";
import { aInsert, aUploadFile } from "@/lib/admin-api";
import { storagePath } from "@/lib/admin-api";

export interface UploadOverrides {
  /** Override the stored display name (only sensible for single-file uploads). */
  name?: string;
  /** Override the stored MIME type. Empty/undefined = auto-detect from the file. */
  fileType?: string;
}

export interface DroppedFile {
  file: File;
  relPath?: string;
}

/**
 * Read a drop payload into files, walking directories when the browser exposes
 * filesystem entries (plain `dataTransfer.files` returns unusable folder stubs).
 */
export async function filesFromDataTransfer(dt: DataTransfer): Promise<DroppedFile[]> {
  const items = Array.from(dt.items ?? []).filter((it) => it.kind === "file");
  const entries = items
    .map((it) => (typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null))
    .filter(Boolean) as FileSystemEntry[];

  if (entries.length === 0) {
    return Array.from(dt.files ?? []).map((file) => ({ file }));
  }

  const out: DroppedFile[] = [];
  const readFile = (entry: FileSystemFileEntry) =>
    new Promise<File | null>((resolve) => entry.file(resolve, () => resolve(null)));
  const readDir = (reader: FileSystemDirectoryReader) =>
    new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));

  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await readFile(entry as FileSystemFileEntry);
      if (file) out.push({ file, relPath: prefix ? `${prefix}/${file.name}` : undefined });
      return;
    }
    const dirPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    for (;;) {
      const batch = await readDir(reader);
      if (batch.length === 0) break;
      for (const child of batch) await walk(child, dirPrefix);
    }
  };

  for (const entry of entries) await walk(entry, "");
  return out;
}

/** Runs tasks with limited concurrency so large imports finish faster. */
export async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}

export async function uploadOne(file: File, folderId: string | null, overrides: UploadOverrides = {}) {
  const displayName = overrides.name?.trim() || file.name;
  const contentType = overrides.fileType?.trim() || file.type || undefined;
  let path = storagePath(folderId, displayName);
  try {
    await aUploadFile(path, file, contentType);
  } catch (e) {
    // One retry with a fresh key — signed upload URLs are short-lived and can
    // collide or expire during large batches.
    const retryPath = storagePath(folderId, displayName);
    try {
      await aUploadFile(retryPath, file, contentType);
      path = retryPath;
    } catch {
      throw e;
    }
  }
  await aInsert("assets", [{
    name: displayName,
    storage_path: path,
    folder_id: folderId,
    file_type: overrides.fileType?.trim() || file.type || null,
    size_bytes: file.size,
  }]);
}

export async function uploadFromRelativePath(
  file: File,
  relPath: string,
  baseFolderId: string | null,
  rootNameOverride?: string,
) {
  const parts = relPath.split("/").filter(Boolean);
  const folderParts = parts.slice(0, -1);
  if (rootNameOverride && folderParts.length > 0) folderParts[0] = rootNameOverride;
  let parent = baseFolderId;
  for (const name of folderParts) {
    parent = await ensureFolder(name, parent);
  }
  await uploadOne(file, parent);
}

/** Selectable MIME types for manual entry in the upload dialog. */
export const FILE_TYPE_OPTIONS: { group: string; items: { label: string; value: string }[] }[] = [
  {
    group: "Image",
    items: [
      { label: "PNG", value: "image/png" },
      { label: "JPEG", value: "image/jpeg" },
      { label: "WebP", value: "image/webp" },
      { label: "GIF", value: "image/gif" },
      { label: "SVG", value: "image/svg+xml" },
      { label: "AVIF", value: "image/avif" },
      { label: "TIFF", value: "image/tiff" },
      { label: "BMP", value: "image/bmp" },
      { label: "HEIC", value: "image/heic" },
      { label: "Photoshop (PSD)", value: "image/vnd.adobe.photoshop" },
    ],
  },
  {
    group: "Video",
    items: [
      { label: "MP4", value: "video/mp4" },
      { label: "WebM", value: "video/webm" },
      { label: "QuickTime (MOV)", value: "video/quicktime" },
      { label: "AVI", value: "video/x-msvideo" },
      { label: "Matroska (MKV)", value: "video/x-matroska" },
      { label: "MPEG", value: "video/mpeg" },
      { label: "OGG video", value: "video/ogg" },
    ],
  },
  {
    group: "Audio",
    items: [
      { label: "MP3", value: "audio/mpeg" },
      { label: "WAV", value: "audio/wav" },
      { label: "AAC", value: "audio/aac" },
      { label: "FLAC", value: "audio/flac" },
      { label: "OGG audio", value: "audio/ogg" },
      { label: "M4A", value: "audio/mp4" },
    ],
  },
  {
    group: "Documents",
    items: [
      { label: "PDF", value: "application/pdf" },
      { label: "Plain text", value: "text/plain" },
      { label: "Markdown", value: "text/markdown" },
      { label: "CSV", value: "text/csv" },
      { label: "JSON", value: "application/json" },
      { label: "XML", value: "application/xml" },
      { label: "HTML", value: "text/html" },
      { label: "Word (DOCX)", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      { label: "Excel (XLSX)", value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { label: "PowerPoint (PPTX)", value: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
    ],
  },
  {
    group: "Archives & projects",
    items: [
      { label: "ZIP", value: "application/zip" },
      { label: "RAR", value: "application/vnd.rar" },
      { label: "7z", value: "application/x-7z-compressed" },
      { label: "TAR", value: "application/x-tar" },
      { label: "GZIP", value: "application/gzip" },
      { label: "Font (TTF)", value: "font/ttf" },
      { label: "Font (OTF)", value: "font/otf" },
      { label: "Font (WOFF2)", value: "font/woff2" },
      { label: "After Effects project", value: "application/x-aftereffects" },
      { label: "Premiere project", value: "application/x-premiere" },
      { label: "Binary / other", value: "application/octet-stream" },
    ],
  },
];

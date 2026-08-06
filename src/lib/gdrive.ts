import { supabase } from "@/integrations/supabase/client";

export type EmbedKind = "folder" | "file" | "link";

export interface GDriveEmbed {
  id: string;
  name: string;
  drive_folder_id: string;
  parent_folder_id: string | null;
  position: number;
  created_at?: string;
}

/** Decoded embed reference. Legacy rows (bare id) are treated as folders. */
export interface EmbedRef {
  kind: EmbedKind;
  ref: string;
  fileType?: string;
}

export function encodeEmbedRef(kind: EmbedKind, ref: string, fileType?: string): string {
  if (kind === "folder") return ref;
  if (kind === "link") return `link:${ref}`;
  return `file:${ref}:${fileType ?? ""}`;
}

export function decodeEmbedRef(stored: string): EmbedRef {
  if (stored.startsWith("link:")) return { kind: "link", ref: stored.slice(5) };
  if (stored.startsWith("file:")) {
    const rest = stored.slice(5);
    const idx = rest.lastIndexOf(":");
    if (idx === -1) return { kind: "file", ref: rest };
    return { kind: "file", ref: rest.slice(0, idx), fileType: rest.slice(idx + 1) || undefined };
  }
  return { kind: "folder", ref: stored };
}

/**
 * Extract a Google Drive FOLDER id from a shareable link.
 * Accepted: /drive/folders/<id>, /drive/u/0/folders/<id>, ?id=<id>, or a bare id.
 * Returns null for file links (/file/d/<id>) — only folders can be embedded.
 */
export function parseDriveFolderId(input: string): { id: string } | { error: string } {
  const raw = input.trim();
  if (!raw) return { error: "Paste a Google Drive folder link" };

  if (/\/file\/d\//.test(raw) || /\/document\/|\/spreadsheets\/|\/presentation\//.test(raw)) {
    return { error: "That's a file link — pick “Embed Drive file” instead" };
  }

  const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return { id: folderMatch[1] };

  const idParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) return { id: idParam[1] };

  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return { id: raw };

  return { error: "Couldn't find a folder id in that link" };
}

/** Extract a Google Drive FILE id from a shareable link (/file/d/<id>, docs links, ?id=). */
export function parseDriveFileId(input: string): { id: string } | { error: string } {
  const raw = input.trim();
  if (!raw) return { error: "Paste a Google Drive file link" };
  if (/\/folders\//.test(raw)) return { error: "That's a folder link — pick “Embed Drive folder” instead" };

  const m =
    raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ??
    raw.match(/\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/) ??
    raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return { id: m[1] };
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return { id: raw };
  return { error: "Couldn't find a file id in that link" };
}

export function driveFolderUrl(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}

export function driveDownloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function drivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export const isDriveFolder = (mimeType: string) => mimeType === "application/vnd.google-apps.folder";


export async function listEmbeds(parentFolderId: string | null): Promise<GDriveEmbed[]> {
  const q = supabase.from("gdrive_embeds").select("*").order("position").order("name");
  const { data } = parentFolderId === null
    ? await q.is("parent_folder_id", null)
    : await q.eq("parent_folder_id", parentFolderId);
  return (data as GDriveEmbed[] | null) ?? [];
}

export async function addEmbed(name: string, driveFolderId: string, parentFolderId: string | null) {
  const { error } = await supabase
    .from("gdrive_embeds")
    .insert({ name, drive_folder_id: driveFolderId, parent_folder_id: parentFolderId });
  if (error) throw error;
}

export async function removeEmbed(id: string) {
  const { error } = await supabase.from("gdrive_embeds").delete().eq("id", id);
  if (error) throw error;
}

export async function renameEmbed(id: string, name: string) {
  const { error } = await supabase.from("gdrive_embeds").update({ name }).eq("id", id);
  if (error) throw error;
}

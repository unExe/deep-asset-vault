import { supabase } from "@/integrations/supabase/client";

export interface GDriveEmbed {
  id: string;
  name: string;
  drive_folder_id: string;
  parent_folder_id: string | null;
  position: number;
  created_at?: string;
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
    return { error: "Only folders can be embedded — that's a file link" };
  }

  const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return { id: folderMatch[1] };

  const idParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) return { id: idParam[1] };

  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return { id: raw };

  return { error: "Couldn't find a folder id in that link" };
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

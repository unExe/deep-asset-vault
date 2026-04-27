import { supabase } from "@/integrations/supabase/client";
import { ensureFolder, getPublicUrl, type Asset, type Folder } from "@/hooks/useFileSystem";
import { recordEvent } from "@/lib/visitor";
import JSZip from "jszip";

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
}

/** Recursively collect all files under a folder, with relative path. */
export async function collectFolderContents(
  folderId: string,
  prefix: string,
): Promise<{ path: string; storage_path: string; name: string }[]> {
  const out: { path: string; storage_path: string; name: string }[] = [];
  const { data: folderRow } = await supabase.from("folders").select("name").eq("id", folderId).maybeSingle();
  const folderName = (folderRow as { name: string } | null)?.name ?? "folder";
  const here = `${prefix}${folderName}/`;

  const { data: files } = await supabase.from("assets").select("name,storage_path").eq("folder_id", folderId);
  for (const f of (files as { name: string; storage_path: string }[] | null) ?? []) {
    out.push({ path: `${here}${f.name}`, storage_path: f.storage_path, name: f.name });
  }
  const { data: subs } = await supabase.from("folders").select("id,name,parent_id").eq("parent_id", folderId);
  for (const s of (subs as FolderRow[] | null) ?? []) {
    const nested = await collectFolderContents(s.id, here);
    out.push(...nested);
  }
  return out;
}

/** Recursively gather all assets under a list of folders for bulk preview. */
export async function collectAssetsRecursive(folderIds: string[]): Promise<Asset[]> {
  const out: Asset[] = [];
  const queue = [...folderIds];
  while (queue.length) {
    const id = queue.shift()!;
    const { data: files } = await supabase.from("assets").select("*").eq("folder_id", id);
    out.push(...(((files as Asset[] | null) ?? [])));
    const { data: subs } = await supabase.from("folders").select("id").eq("parent_id", id);
    queue.push(...((subs as { id: string }[] | null) ?? []).map((s) => s.id));
  }
  return out;
}

export function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadSelection(
  selectedAssets: Asset[],
  selectedFolderIds: string[],
) {
  const totalCount = selectedAssets.length + selectedFolderIds.length;
  if (totalCount === 1 && selectedAssets.length === 1) {
    const a = selectedAssets[0];
    const blob = await fetch(getPublicUrl(a.storage_path)).then((r) => r.blob());
    triggerDownload(blob, a.name);
    void recordEvent(a.id, "download");
    return;
  }
  const zip = new JSZip();
  await Promise.all(
    selectedAssets.map(async (a) => {
      const blob = await fetch(getPublicUrl(a.storage_path)).then((r) => r.blob());
      zip.file(a.name, blob);
      void recordEvent(a.id, "download");
    }),
  );
  for (const fid of selectedFolderIds) {
    const items = await collectFolderContents(fid, "");
    await Promise.all(
      items.map(async (it) => {
        const blob = await fetch(getPublicUrl(it.storage_path)).then((r) => r.blob());
        zip.file(it.path, blob);
      }),
    );
  }
  const out = await zip.generateAsync({ type: "blob" });
  triggerDownload(out, `vault-${Date.now()}.zip`);
}

/** Move a file in storage (download + re-upload + delete original). */
async function moveStorageFile(oldPath: string, newPath: string): Promise<void> {
  const blob = await fetch(getPublicUrl(oldPath)).then((r) => r.blob());
  const { error: upErr } = await supabase.storage.from("assets").upload(newPath, blob);
  if (upErr) throw upErr;
  await supabase.storage.from("assets").remove([oldPath]);
}

async function copyStorageFile(oldPath: string, newPath: string): Promise<void> {
  const blob = await fetch(getPublicUrl(oldPath)).then((r) => r.blob());
  const { error: upErr } = await supabase.storage.from("assets").upload(newPath, blob);
  if (upErr) throw upErr;
}

/** Recursively duplicate a folder (and contents) into destinationId. */
async function copyFolderRecursive(srcId: string, destParentId: string | null): Promise<void> {
  const { data: src } = await supabase.from("folders").select("name").eq("id", srcId).maybeSingle();
  const name = (src as { name: string } | null)?.name ?? "Untitled";
  const { data: ins } = await supabase.from("folders").insert({ name, parent_id: destParentId }).select("id").single();
  const newId = (ins as { id: string }).id;

  const { data: files } = await supabase.from("assets").select("*").eq("folder_id", srcId);
  for (const f of ((files as Asset[] | null) ?? [])) {
    const newPath = `${newId}/${crypto.randomUUID()}-${f.name}`;
    await copyStorageFile(f.storage_path, newPath);
    await supabase.from("assets").insert({
      name: f.name,
      storage_path: newPath,
      folder_id: newId,
      file_type: f.file_type,
      size_bytes: f.size_bytes,
    });
  }
  const { data: subs } = await supabase.from("folders").select("id").eq("parent_id", srcId);
  for (const s of ((subs as { id: string }[] | null) ?? [])) {
    await copyFolderRecursive(s.id, newId);
  }
}

/** Paste clipboard items into destFolderId. */
export async function pasteClipboard(
  items: { id: string; kind: "folder" | "asset" }[],
  mode: "copy" | "cut",
  destFolderId: string | null,
): Promise<void> {
  for (const it of items) {
    if (it.kind === "asset") {
      const { data } = await supabase.from("assets").select("*").eq("id", it.id).maybeSingle();
      const a = data as Asset | null;
      if (!a) continue;
      if (mode === "cut") {
        const newPath = `${destFolderId ?? "root"}/${crypto.randomUUID()}-${a.name}`;
        await moveStorageFile(a.storage_path, newPath);
        await supabase.from("assets").update({ folder_id: destFolderId, storage_path: newPath }).eq("id", a.id);
      } else {
        const newPath = `${destFolderId ?? "root"}/${crypto.randomUUID()}-${a.name}`;
        await copyStorageFile(a.storage_path, newPath);
        await supabase.from("assets").insert({
          name: a.name,
          storage_path: newPath,
          folder_id: destFolderId,
          file_type: a.file_type,
          size_bytes: a.size_bytes,
        });
      }
    } else {
      if (mode === "cut") {
        if (destFolderId && (await isDescendant(it.id, destFolderId))) continue;
        await supabase.from("folders").update({ parent_id: destFolderId }).eq("id", it.id);
      } else {
        await copyFolderRecursive(it.id, destFolderId);
      }
    }
  }
}

async function isDescendant(folderId: string, possibleDescId: string): Promise<boolean> {
  let cursor: string | null = possibleDescId;
  while (cursor !== null) {
    if (cursor === folderId) return true;
    const res = await supabase.from("folders").select("parent_id").eq("id", cursor).maybeSingle();
    const row = res.data as Folder | null;
    cursor = row?.parent_id ?? null;
  }
  return false;
}

export async function renameItem(id: string, kind: "folder" | "asset", newName: string): Promise<void> {
  if (!newName.trim()) return;
  if (kind === "folder") {
    await supabase.from("folders").update({ name: newName }).eq("id", id);
  } else {
    await supabase.from("assets").update({ name: newName }).eq("id", id);
  }
}

export { ensureFolder };

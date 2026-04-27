import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}
export interface Asset {
  id: string;
  name: string;
  storage_path: string;
  folder_id: string | null;
  file_type: string | null;
  size_bytes: number | null;
}

export function useFileSystem(currentFolderId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const folderQ = supabase.from("folders").select("*").order("name");
    const assetQ = supabase.from("assets").select("*").order("name");

    const [{ data: f }, { data: a }] = await Promise.all([
      currentFolderId === null
        ? folderQ.is("parent_id", null)
        : folderQ.eq("parent_id", currentFolderId),
      currentFolderId === null
        ? assetQ.is("folder_id", null)
        : assetQ.eq("folder_id", currentFolderId),
    ]);

    setFolders((f as Folder[]) ?? []);
    setAssets((a as Asset[]) ?? []);
    setLoading(false);
  }, [currentFolderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { folders, assets, loading, refresh };
}

export async function getBreadcrumbs(folderId: string | null): Promise<Folder[]> {
  if (!folderId) return [];
  const trail: Folder[] = [];
  let cursor: string | null = folderId;
  while (cursor) {
    const res = await supabase.from("folders").select("*").eq("id", cursor).maybeSingle();
    const row = res.data as Folder | null;
    if (!row) break;
    trail.unshift(row);
    cursor = row.parent_id;
  }
  return trail;
}

/** Resolve a "/A/B/C" style path to a folder id (or null for root). Returns null if not found OR if it's root. */
export async function resolvePath(path: string): Promise<string | null> {
  const parts = path.split("/").map((p) => p.trim()).filter(Boolean);
  let parentId: string | null = null;
  for (const name of parts) {
    const q = supabase.from("folders").select("id,name,parent_id").eq("name", name);
    const { data } = parentId === null ? await q.is("parent_id", null) : await q.eq("parent_id", parentId);
    const rows = (data as Folder[] | null) ?? [];
    if (rows.length === 0) return parentId; // best-effort: stay at the deepest matched
    parentId = rows[0].id;
  }
  return parentId;
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from("assets").getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Find or create a folder named `name` under parentId. */
export async function ensureFolder(name: string, parentId: string | null): Promise<string> {
  const q = supabase.from("folders").select("id").eq("name", name);
  const { data } = parentId === null ? await q.is("parent_id", null) : await q.eq("parent_id", parentId);
  const existing = (data as { id: string }[] | null) ?? [];
  if (existing.length) return existing[0].id;
  const { data: ins, error } = await supabase
    .from("folders")
    .insert({ name, parent_id: parentId })
    .select("id")
    .single();
  if (error || !ins) throw error ?? new Error("create folder failed");
  return (ins as { id: string }).id;
}

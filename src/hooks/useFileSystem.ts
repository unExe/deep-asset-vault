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
    const { data } = await supabase
      .from("folders")
      .select("*")
      .eq("id", cursor)
      .maybeSingle();
    if (!data) break;
    trail.unshift(data as Folder);
    cursor = (data as Folder).parent_id;
  }
  return trail;
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from("assets").getPublicUrl(storagePath);
  return data.publicUrl;
}

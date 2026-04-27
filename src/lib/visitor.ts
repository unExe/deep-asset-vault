/** Anonymous per-browser visitor id (for view/download counts). */
import { supabase } from "@/integrations/supabase/client";

const KEY = "vault_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function recordEvent(assetId: string, kind: "view" | "download") {
  if (typeof window === "undefined") return;
  try {
    await supabase
      .from("asset_events")
      .insert({ asset_id: assetId, visitor_id: getVisitorId(), kind });
  } catch {
    /* unique violation = already recorded for this visitor; ignore */
  }
}

export async function getEventCounts(
  assetId: string,
): Promise<{ views: number; downloads: number }> {
  const [{ count: v }, { count: d }] = await Promise.all([
    supabase
      .from("asset_events")
      .select("id", { count: "exact", head: true })
      .eq("asset_id", assetId)
      .eq("kind", "view"),
    supabase
      .from("asset_events")
      .select("id", { count: "exact", head: true })
      .eq("asset_id", assetId)
      .eq("kind", "download"),
  ]);
  return { views: v ?? 0, downloads: d ?? 0 };
}

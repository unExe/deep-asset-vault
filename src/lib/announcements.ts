import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { aDelete, aInsert, aUpdate } from "@/lib/admin-api";

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  created_at: string;
}

const SEEN_KEY = "vault.announcements.seen";
export const ANNOUNCEMENTS_CHANGED = "vault:announcements-changed";

export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select("id,title,description,banner_url,created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Announcement[] | null) ?? [];
}

export async function addAnnouncement(values: {
  title: string;
  description?: string;
  banner_url?: string;
}) {
  await aInsert("announcements", [
    {
      title: values.title,
      description: values.description || null,
      banner_url: values.banner_url || null,
      published: true,
    },
  ]);
  notifyChanged();
}

export async function updateAnnouncement(id: string, values: Record<string, unknown>) {
  await aUpdate("announcements", id, values);
  notifyChanged();
}

export async function deleteAnnouncement(id: string) {
  await aDelete("announcements", [id]);
  notifyChanged();
}

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ANNOUNCEMENTS_CHANGED));
}

/** Ids the visitor has already opened, used for the unread dot. */
export function getSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markAllSeen(items: Announcement[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify(items.map((a) => a.id).slice(0, 100)));
  window.dispatchEvent(new Event(ANNOUNCEMENTS_CHANGED));
}

export function useAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const rows = await fetchAnnouncements();
    setItems(rows);
    const seen = new Set(getSeen());
    setUnread(rows.filter((r) => !seen.has(r.id)).length);
  }, []);

  useEffect(() => {
    void load();
    const on = () => void load();
    window.addEventListener(ANNOUNCEMENTS_CHANGED, on);
    return () => window.removeEventListener(ANNOUNCEMENTS_CHANGED, on);
  }, [load]);

  return { items, unread, reload: load };
}

export async function submitMaterialRequest(values: {
  title: string;
  details?: string;
  contact?: string;
}) {
  const { error } = await supabase.from("material_requests").insert({
    title: values.title.slice(0, 200),
    details: (values.details ?? "").slice(0, 2000) || null,
    contact: (values.contact ?? "").slice(0, 200) || null,
  });
  if (error) throw new Error(error.message);
}

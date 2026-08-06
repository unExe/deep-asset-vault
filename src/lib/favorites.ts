/** localStorage-backed favorites store with subscription. */
import { useEffect, useState } from "react";

const KEY = "vault_favorites_v1";

export interface FavoriteEntry {
  id: string;
  kind: "folder" | "asset";
  name: string;
  addedAt: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(items: FavoriteEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const Favorites = {
  list: read,
  has(id: string) {
    return read().some((f) => f.id === id);
  },
  add(entry: Omit<FavoriteEntry, "addedAt">) {
    const cur = read();
    if (cur.some((f) => f.id === entry.id)) return;
    write([...cur, { ...entry, addedAt: Date.now() }]);
  },
  remove(id: string) {
    write(read().filter((f) => f.id !== id));
  },
  toggle(entry: Omit<FavoriteEntry, "addedAt">) {
    if (Favorites.has(entry.id)) Favorites.remove(entry.id);
    else Favorites.add(entry);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useFavorites() {
  // Start empty so SSR and the first client render match, then hydrate.
  const [items, setItems] = useState<FavoriteEntry[]>([]);
  useEffect(() => {
    setItems(read());
    const unsub = Favorites.subscribe(() => setItems(read()));
    return () => {
      unsub();
    };
  }, []);
  return items;
}

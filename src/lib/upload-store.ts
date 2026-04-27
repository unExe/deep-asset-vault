import { create } from "zustand";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  status: UploadStatus;
  error?: string;
}

interface UploadState {
  items: UploadItem[];
  collapsed: boolean;
  add: (id: string, name: string) => void;
  set: (id: string, status: UploadStatus, error?: string) => void;
  clear: () => void;
  toggleCollapsed: () => void;
  remove: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  items: [],
  collapsed: false,
  add: (id, name) =>
    set((s) => ({ items: [...s.items, { id, name, status: "queued" }], collapsed: false })),
  set: (id, status, error) =>
    set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, status, error } : it)) })),
  clear: () => set({ items: [] }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
}));

import { create } from "zustand";

export type SelectionKind = "folder" | "asset";
export type ClipboardMode = "copy" | "cut";

export interface ClipboardEntry {
  id: string;
  kind: SelectionKind;
}

interface VaultState {
  selected: Map<string, SelectionKind>;
  toggle: (id: string, kind: SelectionKind) => void;
  selectOnly: (id: string, kind: SelectionKind) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;

  clipboard: { mode: ClipboardMode; items: ClipboardEntry[] } | null;
  setClipboard: (mode: ClipboardMode, items: ClipboardEntry[]) => void;
  clearClipboard: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  selected: new Map(),
  toggle: (id, kind) =>
    set((s) => {
      const next = new Map(s.selected);
      if (next.has(id)) next.delete(id);
      else next.set(id, kind);
      return { selected: next };
    }),
  selectOnly: (id, kind) => set({ selected: new Map([[id, kind]]) }),
  clear: () => set({ selected: new Map() }),
  isSelected: (id) => get().selected.has(id),

  clipboard: null,
  setClipboard: (mode, items) => set({ clipboard: { mode, items } }),
  clearClipboard: () => set({ clipboard: null }),
}));

import { create } from "zustand";

export type SelectionKind = "folder" | "asset";

interface VaultState {
  selected: Map<string, SelectionKind>;
  toggle: (id: string, kind: SelectionKind) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
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
  clear: () => set({ selected: new Map() }),
  isSelected: (id) => get().selected.has(id),
}));

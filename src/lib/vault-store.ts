import { create } from "zustand";

interface VaultState {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  selected: new Set(),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selected: next };
    }),
  clear: () => set({ selected: new Set() }),
  isSelected: (id) => get().selected.has(id),
}));

import { useEffect, useState } from "react";

export type ActionId =
  | "copy"
  | "cut"
  | "paste"
  | "rename"
  | "delete"
  | "search"
  | "newFolder"
  | "upload"
  | "selectAll"
  | "preview"
  | "download"
  | "info"
  | "favorite"
  | "toggleSidebar"
  | "comments"
  | "settings"
  | "help"
  | "switchAdmin";

export const ACTION_LABELS: Record<ActionId, string> = {
  copy: "Copy selection",
  cut: "Cut selection",
  paste: "Paste",
  rename: "Rename",
  delete: "Delete",
  search: "Focus / open search",
  newFolder: "New folder",
  upload: "Open upload dialog",
  selectAll: "Select all",
  preview: "Preview selection",
  download: "Download selection",
  info: "Show info",
  favorite: "Toggle favorite",
  toggleSidebar: "Toggle sidebar",
  comments: "Jump to comments",
  settings: "Open settings",
  help: "Keyboard shortcuts",
  switchAdmin: "Switch admin page",
};

export const DEFAULT_KEYBINDS: Record<ActionId, string> = {
  copy: "ctrl+c",
  cut: "ctrl+x",
  paste: "ctrl+v",
  rename: "f2",
  delete: "delete",
  search: "ctrl+k",
  newFolder: "ctrl+shift+n",
  upload: "ctrl+u",
  selectAll: "ctrl+a",
  preview: "enter",
  download: "ctrl+d",
  info: "ctrl+i",
  favorite: "ctrl+b",
  toggleSidebar: "ctrl+\\",
  comments: "ctrl+shift+c",
  settings: "ctrl+,",
  help: "shift+?",
  switchAdmin: "ctrl+shift+a",
};

export interface UserSettings {
  /** Ask before opening a link that leaves this site. */
  confirmExternalLinks: boolean;
  /** Enable the keyboard shortcut system. */
  shortcutsEnabled: boolean;
  /** Show the comment section / floating comment button. */
  showComments: boolean;
  /** Open the comment composer in a dialog instead of inline (always on mobile). */
  commentsAsDialog: boolean;
  keybinds: Record<ActionId, string>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  confirmExternalLinks: false,
  shortcutsEnabled: true,
  showComments: true,
  commentsAsDialog: false,
  keybinds: DEFAULT_KEYBINDS,
};

const KEY = "vault_user_settings";
const EVENT = "vault:settings-changed";

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      keybinds: { ...DEFAULT_KEYBINDS, ...(parsed.keybinds ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: UserSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

/** Reactive settings; starts from defaults on the server and hydrates in an effect. */
export function useUserSettings(): [UserSettings, (patch: Partial<UserSettings>) => void] {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<UserSettings>) => {
    const next = { ...loadSettings(), ...patch };
    saveSettings(next);
    setSettings(next);
  };

  return [settings, update];
}

/* ------------------------------ key handling ------------------------------ */

const NAMED: Record<string, string> = {
  " ": "space",
  escape: "esc",
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
};

/** Normalise a keyboard event into a comparable combo string, e.g. "ctrl+shift+c". */
export function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  let key = e.key.toLowerCase();
  key = NAMED[key] ?? key;
  if (["control", "meta", "alt", "shift"].includes(key)) return parts.join("+");
  parts.push(key);
  return parts.join("+");
}

/** Human-readable rendering of a stored combo. */
export function formatCombo(combo: string): string {
  return combo
    .split("+")
    .map((p) => (p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" + ");
}

import { useEffect, useState } from "react";
import { Keyboard, X as XIcon, ArrowCounterClockwise, Gear, ShieldCheck } from "@phosphor-icons/react";
import {
  ACTION_LABELS,
  DEFAULT_KEYBINDS,
  comboFromEvent,
  formatCombo,
  useUserSettings,
  type ActionId,
} from "@/lib/user-settings";

const ACTION_IDS = Object.keys(ACTION_LABELS) as ActionId[];

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [settings, update] = useUserSettings();
  const [tab, setTab] = useState<"general" | "keys">("general");
  const [capturing, setCapturing] = useState<ActionId | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setCapturing(null);
        return;
      }
      const combo = comboFromEvent(e);
      if (!combo || ["ctrl", "alt", "shift"].includes(combo)) return;
      update({ keybinds: { ...settings.keybinds, [capturing]: combo } });
      setCapturing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, settings.keybinds, update]);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-vault-hairline bg-vault-menu-bg text-vault-fg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 px-5 py-3.5 border-b border-vault-hairline">
          <Gear size={17} />
          <h2 className="text-sm font-semibold flex-1">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-vault-overlay-strong" aria-label="Close">
            <XIcon size={16} />
          </button>
        </header>

        <div className="flex gap-1 px-4 border-b border-vault-hairline">
          {([["general", "General", <ShieldCheck key="a" size={14} />], ["keys", "Keyboard", <Keyboard key="b" size={14} />]] as const).map(
            ([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors ${
                  tab === id ? "border-vault-fg text-vault-fg" : "border-transparent text-vault-fg-muted hover:text-vault-fg"
                }`}
              >
                {icon}
                {label}
              </button>
            ),
          )}
        </div>

        <div className="overflow-y-auto p-5 space-y-3">
          {tab === "general" ? (
            <>
              <Toggle
                label="Confirm before going to another site"
                desc="Show a confirmation dialog before any external link opens."
                checked={settings.confirmExternalLinks}
                onChange={(v) => update({ confirmExternalLinks: v })}
              />
              <Toggle
                label="Keyboard shortcuts"
                desc="Enable all vault keyboard shortcuts."
                checked={settings.shortcutsEnabled}
                onChange={(v) => update({ shortcutsEnabled: v })}
              />
              <Toggle
                label="Show comments"
                desc="Show the comment section and the floating comment button."
                checked={settings.showComments}
                onChange={(v) => update({ showComments: v })}
              />
              <Toggle
                label="Always open comments in a dialog"
                desc="Use the modal comment view on desktop too (it is always used on mobile)."
                checked={settings.commentsAsDialog}
                onChange={(v) => update({ commentsAsDialog: v })}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-vault-fg-muted">Click a shortcut, then press the new key combination.</p>
                <button
                  onClick={() => update({ keybinds: { ...DEFAULT_KEYBINDS } })}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-vault-hairline hover:bg-vault-overlay-strong"
                >
                  <ArrowCounterClockwise size={13} /> Reset
                </button>
              </div>
              <ul className="divide-y divide-vault-hairline rounded-lg border border-vault-hairline">
                {ACTION_IDS.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="text-sm">{ACTION_LABELS[id]}</span>
                    <button
                      onClick={() => setCapturing(id)}
                      className={`font-mono text-[11px] px-2.5 py-1.5 rounded-md border min-w-[110px] text-center transition-colors ${
                        capturing === id
                          ? "border-vault-fg bg-vault-fg text-vault-bg animate-pulse"
                          : "border-vault-hairline text-vault-fg-muted hover:text-vault-fg hover:bg-vault-overlay-strong"
                      }`}
                    >
                      {capturing === id ? "Press keys…" : formatCombo(settings.keybinds[id])}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-vault-hairline cursor-pointer hover:bg-vault-overlay">
      <span>
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-vault-fg-muted mt-0.5">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span className="mt-0.5 shrink-0 w-9 h-5 rounded-full bg-vault-overlay-strong border border-vault-hairline relative transition-colors peer-checked:bg-vault-fg">
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
            checked ? "translate-x-4 bg-vault-bg" : "bg-vault-fg-muted"
          }`}
        />
      </span>
    </label>
  );
}

/** Compact cheat-sheet overlay listing every shortcut. */
export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const [settings] = useUserSettings();
  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-vault-hairline bg-vault-menu-bg text-vault-fg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={17} />
          <h2 className="text-sm font-semibold flex-1">Keyboard shortcuts</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-vault-overlay-strong" aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-6">
          {ACTION_IDS.map((id) => (
            <li key={id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span className="text-vault-fg-muted">{ACTION_LABELS[id]}</span>
              <kbd className="font-mono text-[11px] px-2 py-1 rounded border border-vault-hairline bg-vault-overlay">
                {formatCombo(settings.keybinds[id])}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

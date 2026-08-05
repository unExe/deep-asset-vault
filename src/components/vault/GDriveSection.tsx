import { useCallback, useEffect, useState } from "react";
import { GoogleDriveLogo, Plus, Trash, PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { GDriveBrowser } from "./GDriveBrowser";
import { addEmbed, listEmbeds, parseDriveFolderId, removeEmbed, renameEmbed, type GDriveEmbed } from "@/lib/gdrive";

interface Props {
  currentFolderId: string | null;
  isEditorMode: boolean;
  search: string;
}

/** Embedded Google Drive folders shown as tiles alongside vault folders. */
export function GDriveSection({ currentFolderId, isEditorMode, search }: Props) {
  const [embeds, setEmbeds] = useState<GDriveEmbed[]>([]);
  const [open, setOpen] = useState<GDriveEmbed | null>(null);
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setEmbeds(await listEmbeds(currentFolderId));
  }, [currentFolderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = search
    ? embeds.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : embeds;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseDriveFolderId(link);
    if ("error" in parsed) {
      toast.error(parsed.error);
      return;
    }
    if (!label.trim()) {
      toast.error("Give the folder a name");
      return;
    }
    setBusy(true);
    try {
      await addEmbed(label.trim().slice(0, 120), parsed.id, currentFolderId);
      toast.success("Drive folder embedded");
      setLink("");
      setLabel("");
      setAdding(false);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't embed that folder");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (embed: GDriveEmbed) => {
    if (!confirm(`Remove the embedded folder "${embed.name}"? Files in Drive are untouched.`)) return;
    try {
      await removeEmbed(embed.id);
      toast.success("Embed removed");
      void refresh();
    } catch {
      toast.error("Remove failed");
    }
  };

  const handleRename = async (embed: GDriveEmbed) => {
    const next = prompt("New name?", embed.name);
    if (!next?.trim()) return;
    try {
      await renameEmbed(embed.id, next.trim().slice(0, 120));
      void refresh();
    } catch {
      toast.error("Rename failed");
    }
  };

  if (visible.length === 0 && !isEditorMode) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <GoogleDriveLogo size={14} className="text-vault-accent" />
        <span className="text-[10px] uppercase tracking-wider text-vault-fg-muted">Drive folders</span>
        {isEditorMode && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
          >
            <Plus size={12} /> Embed Drive folder
          </button>
        )}
      </div>

      {isEditorMode && adding && (
        <form
          onSubmit={submit}
          onClick={(e) => e.stopPropagation()}
          className="mb-3 p-3 rounded-lg bg-vault-overlay border border-vault-hairline space-y-2"
        >
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/…"
            className="w-full h-8 px-2.5 bg-vault-bg border border-vault-hairline rounded text-xs text-vault-fg placeholder:text-vault-fg-muted outline-none"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            placeholder="Display name"
            className="w-full h-8 px-2.5 bg-vault-bg border border-vault-hairline rounded text-xs text-vault-fg placeholder:text-vault-fg-muted outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded bg-vault-fg text-vault-bg disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs px-3 py-1.5 rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
            >
              Cancel
            </button>
            <span className="text-[11px] text-vault-fg-muted">
              Folder must be shared as “Anyone with the link”. Only links are stored — no files are copied.
            </span>
          </div>
        </form>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 sm:gap-3">
          {visible.map((e) => (
            <div
              key={e.id}
              onClick={(ev) => {
                ev.stopPropagation();
                setOpen(e);
              }}
              className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong border border-vault-hairline/50 transition-colors cursor-pointer select-none"
            >
              <GoogleDriveLogo size={38} weight="fill" className="text-vault-accent" />
              <span className="block text-xs text-vault-fg truncate text-center w-full">{e.name}</span>
              <span className="text-[10px] text-vault-fg-muted">Google Drive</span>
              {isEditorMode && (
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      void handleRename(e);
                    }}
                    className="p-1 rounded bg-vault-menu-bg border border-vault-hairline text-vault-fg-muted"
                    aria-label="Rename embed"
                  >
                    <PencilSimple size={12} />
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      void handleRemove(e);
                    }}
                    className="p-1 rounded bg-vault-menu-bg border border-vault-hairline text-vault-danger"
                    aria-label="Remove embed"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {open && <GDriveBrowser rootId={open.drive_folder_id} rootName={open.name} onClose={() => setOpen(null)} />}
    </div>
  );
}

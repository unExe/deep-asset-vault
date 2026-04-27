import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotePencil, X, FloppyDisk } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Props {
  folderId: string | null;
  isEditorMode: boolean;
}

/** Inline info.md viewer/editor for the current folder. */
export function FolderInfoBanner({ folderId, isEditorMode }: Props) {
  const [md, setMd] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (folderId === null) {
      setMd("");
      setLoaded(true);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("folders")
        .select("info_md")
        .eq("id", folderId)
        .maybeSingle();
      setMd((data as { info_md: string } | null)?.info_md ?? "");
      setLoaded(true);
    })();
  }, [folderId]);

  if (!loaded) return null;
  if (folderId === null) return null;
  if (!editing && !md.trim() && !isEditorMode) return null;

  const startEdit = () => {
    setDraft(md);
    setEditing(true);
  };
  const save = async () => {
    const { error } = await supabase.from("folders").update({ info_md: draft }).eq("id", folderId);
    if (error) {
      toast.error("Save failed");
      return;
    }
    setMd(draft);
    setEditing(false);
    toast.success("Info saved");
  };

  return (
    <div className="rounded-lg border border-vault-hairline bg-vault-overlay p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-vault-fg-muted">info.md</div>
        {isEditorMode && !editing && (
          <button
            onClick={startEdit}
            className="text-xs text-vault-fg-muted hover:text-vault-fg flex items-center gap-1 px-2 py-1 rounded hover:bg-vault-overlay-strong"
          >
            <NotePencil size={12} /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Markdown notes about this folder…"
            className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40 font-mono"
          />
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-md text-xs text-vault-fg-muted hover:bg-vault-overlay-strong inline-flex items-center gap-1"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={save}
              className="px-3 py-1.5 rounded-md text-xs bg-vault-fg text-vault-bg inline-flex items-center gap-1 hover:opacity-90"
            >
              <FloppyDisk size={12} /> Save
            </button>
          </div>
        </>
      ) : md.trim() ? (
        <pre className="whitespace-pre-wrap text-sm text-vault-fg font-sans leading-relaxed">{md}</pre>
      ) : (
        <div className="text-xs text-vault-fg-muted italic">No info yet. Click Edit to add notes.</div>
      )}
    </div>
  );
}

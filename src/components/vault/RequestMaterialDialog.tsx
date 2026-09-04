import { useState } from "react";
import { X as XIcon, PaperPlaneTilt, HandHeart } from "@phosphor-icons/react";
import { toast } from "sonner";
import { submitMaterialRequest } from "@/lib/announcements";

const inputCls =
  "w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted focus:outline-none focus:border-vault-fg/40";

export function RequestMaterialDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await submitMaterialRequest({ title: title.trim(), details, contact });
      toast.success("Request sent — thanks!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-vault-hairline bg-vault-menu-bg text-vault-fg overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-vault-hairline">
          <HandHeart size={16} weight="duotone" />
          <h2 className="text-sm font-medium">Request material</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] text-vault-fg-muted mb-1">What do you need?</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Anime overlay pack"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] text-vault-fg-muted mb-1">Details (optional)</label>
            <textarea
              className={`${inputCls} min-h-24 resize-y`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              placeholder="Style, resolution, references…"
            />
          </div>
          <div>
            <label className="block text-[11px] text-vault-fg-muted mb-1">
              Contact (optional)
            </label>
            <input
              className={inputCls}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder="Telegram / email"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-vault-hairline flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-vault-hairline text-xs text-vault-fg hover:bg-vault-overlay-strong"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-vault-fg text-vault-bg text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            <PaperPlaneTilt size={14} weight="fill" /> {busy ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </div>
  );
}

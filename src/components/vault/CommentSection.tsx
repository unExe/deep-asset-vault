import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatCircle, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { z } from "zod";

interface Comment {
  id: string;
  folder_id: string | null;
  name: string;
  email: string | null;
  body: string;
  created_at: string;
}

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Comment required").max(2000),
});

interface Props {
  folderId: string | null;
  isEditorMode: boolean;
}

export function CommentSection({ folderId, isEditorMode }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const q = supabase.from("folder_comments").select("*").order("created_at", { ascending: false });
    const res = folderId === null ? await q.is("folder_id", null) : await q.eq("folder_id", folderId);
    setComments((res.data as Comment[] | null) ?? []);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  // Persist name/email between submissions
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("vault_commenter");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setName(p.name ?? "");
        setEmail(p.email ?? "");
      } catch {/* ignore */}
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, body });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("folder_comments").insert({
        folder_id: folderId,
        name: parsed.data.name,
        email: parsed.data.email ? parsed.data.email : null,
        body: parsed.data.body,
      });
      if (error) throw error;
      localStorage.setItem("vault_commenter", JSON.stringify({ name: parsed.data.name, email: parsed.data.email }));
      setBody("");
      await refresh();
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    await supabase.from("folder_comments").delete().eq("id", id);
    void refresh();
  };

  return (
    <section className="mt-12 border-t border-vault-hairline pt-6">
      <div className="flex items-center gap-2 mb-4">
        <ChatCircle size={18} className="text-vault-fg-muted" />
        <h2 className="text-sm font-medium text-vault-fg">
          Comments {comments.length > 0 && <span className="text-vault-fg-muted">({comments.length})</span>}
        </h2>
      </div>

      <form onSubmit={submit} className="space-y-2 mb-6 p-3 rounded-lg bg-vault-overlay border border-vault-hairline">
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name *"
            maxLength={80}
            className="h-9 px-3 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            maxLength={200}
            className="h-9 px-3 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a comment…"
          maxLength={2000}
          rows={3}
          className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40 resize-y"
          required
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-vault-fg-muted">{body.length}/2000</span>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-1.5 rounded-md bg-vault-fg text-vault-bg text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-xs text-vault-fg-muted text-center py-4">No comments yet. Be the first.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="p-3 rounded-md bg-vault-overlay border border-vault-hairline">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="text-xs">
                <span className="font-medium text-vault-fg">{c.name}</span>
                <span className="text-vault-fg-muted ml-2">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              {isEditorMode && (
                <button
                  onClick={() => del(c.id)}
                  className="p-1 rounded hover:bg-vault-danger/15 text-vault-fg-muted hover:text-vault-danger"
                  aria-label="Delete"
                >
                  <Trash size={12} />
                </button>
              )}
            </div>
            <p className="text-sm text-vault-fg whitespace-pre-wrap break-words">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

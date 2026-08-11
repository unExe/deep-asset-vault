import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatCircle, Trash, ArrowBendUpLeft, X as XIcon, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { z } from "zod";
import { aDelete } from "@/lib/admin-api";
import { useUserSettings } from "@/lib/user-settings";

interface Comment {
  id: string;
  folder_id: string | null;
  parent_id: string | null;
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

/* ------------------------------- data hook -------------------------------- */

function useComments(folderId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);

  const refresh = useCallback(async () => {
    const q = supabase.from("folder_comments").select("*").order("created_at", { ascending: false });
    const res = folderId === null ? await q.is("folder_id", null) : await q.eq("folder_id", folderId);
    setComments((res.data as Comment[] | null) ?? []);
  }, [folderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { roots, repliesOf, total } = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return {
      roots: comments.filter((c) => !c.parent_id),
      repliesOf: (id: string) => map.get(id) ?? [],
      total: comments.length,
    };
  }, [comments]);

  return { roots, repliesOf, total, refresh };
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const units: [number, string][] = [
    [60, "m"],
    [3600, "h"],
    [86400, "d"],
  ];
  if (s < 3600) return `${Math.floor(s / units[0][0])}m ago`;
  if (s < 86400) return `${Math.floor(s / units[1][0])}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / units[2][0])}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

/* --------------------------------- form ----------------------------------- */

function CommentForm({
  folderId,
  parentId,
  onPosted,
  onCancel,
  compact,
  autoFocus,
}: {
  folderId: string | null;
  parentId?: string | null;
  onPosted: () => void;
  onCancel?: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vault_commenter");
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      setName(p.name ?? "");
      setEmail(p.email ?? "");
    } catch {
      /* ignore */
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
        parent_id: parentId ?? null,
        name: parsed.data.name,
        email: parsed.data.email ? parsed.data.email : null,
        body: parsed.data.body,
      });
      if (error) throw error;
      localStorage.setItem(
        "vault_commenter",
        JSON.stringify({ name: parsed.data.name, email: parsed.data.email }),
      );
      setBody("");
      onPosted();
      toast.success(parentId ? "Reply posted" : "Comment posted");
      onCancel?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "h-9 px-3 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40";

  return (
    <form
      onSubmit={submit}
      className={`space-y-2 ${compact ? "" : "p-3 rounded-lg bg-vault-overlay border border-vault-hairline"}`}
    >
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" maxLength={80} className={field} required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} className={field} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? "Write a reply…" : "Leave a comment…"}
        maxLength={2000}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg placeholder:text-vault-fg-muted outline-none focus:border-vault-fg/40 resize-y"
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-vault-fg-muted">{body.length}/2000</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs text-vault-fg-muted hover:text-vault-fg">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-vault-fg text-vault-bg text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            <PaperPlaneTilt size={12} weight="fill" />
            {busy ? "Posting…" : parentId ? "Reply" : "Post comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* --------------------------------- thread --------------------------------- */

function CommentItem({
  comment,
  replies,
  folderId,
  isEditorMode,
  onChanged,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  folderId: string | null;
  isEditorMode: boolean;
  onChanged: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [open, setOpen] = useState(true);

  const del = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await aDelete("folder_comments", [comment.id]);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <li className={depth > 0 ? "pl-3 sm:pl-4 border-l border-vault-hairline" : ""}>
      <div className="p-3 rounded-lg bg-vault-overlay border border-vault-hairline">
        <div className="flex items-start gap-2.5">
          <span className="shrink-0 w-7 h-7 rounded-full bg-vault-overlay-strong border border-vault-hairline grid place-items-center text-[10px] font-semibold text-vault-fg">
            {initials(comment.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-medium text-vault-fg">{comment.name}</span>
              <span className="text-[10px] text-vault-fg-muted">{timeAgo(comment.created_at)}</span>
            </div>
            <p className="text-sm text-vault-fg whitespace-pre-wrap break-words mt-1">{comment.body}</p>
            <div className="flex items-center gap-3 mt-2">
              {depth < 3 && (
                <button
                  onClick={() => setReplying((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] text-vault-fg-muted hover:text-vault-fg"
                >
                  <ArrowBendUpLeft size={12} /> Reply
                </button>
              )}
              {replies.length > 0 && (
                <button onClick={() => setOpen((v) => !v)} className="text-[11px] text-vault-fg-muted hover:text-vault-fg">
                  {open ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
              {isEditorMode && (
                <button
                  onClick={() => void del()}
                  className="ml-auto p-1 rounded hover:bg-vault-danger/15 text-vault-fg-muted hover:text-vault-danger"
                  aria-label="Delete"
                >
                  <Trash size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {replying && (
          <div className="mt-3">
            <CommentForm
              folderId={folderId}
              parentId={comment.id}
              compact
              autoFocus
              onPosted={onChanged}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {open && replies.length > 0 && (
        <ul className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              folderId={folderId}
              isEditorMode={isEditorMode}
              onChanged={onChanged}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Thread({
  folderId,
  isEditorMode,
  roots,
  repliesOf,
  refresh,
}: {
  folderId: string | null;
  isEditorMode: boolean;
  roots: Comment[];
  repliesOf: (id: string) => Comment[];
  refresh: () => void;
}) {
  return (
    <>
      <CommentForm folderId={folderId} onPosted={refresh} />
      <ul className="space-y-3 mt-5">
        {roots.length === 0 && (
          <li className="text-xs text-vault-fg-muted text-center py-6">No comments yet. Be the first.</li>
        )}
        {roots.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={repliesOf(c.id)}
            folderId={folderId}
            isEditorMode={isEditorMode}
            onChanged={refresh}
          />
        ))}
      </ul>
    </>
  );
}

/* ------------------------------ public pieces ----------------------------- */

export const COMMENTS_ANCHOR_ID = "vault-comments";

/** Inline comment section rendered at the bottom of the vault page. */
export function CommentSection({ folderId, isEditorMode }: { folderId: string | null; isEditorMode: boolean }) {
  const { roots, repliesOf, total, refresh } = useComments(folderId);

  return (
    <section id={COMMENTS_ANCHOR_ID} className="mt-12 border-t border-vault-hairline pt-6 scroll-mt-24">
      <div className="flex items-center gap-2 mb-4">
        <ChatCircle size={18} className="text-vault-fg-muted" />
        <h2 className="text-sm font-medium text-vault-fg">
          Comments {total > 0 && <span className="text-vault-fg-muted">({total})</span>}
        </h2>
      </div>
      <Thread folderId={folderId} isEditorMode={isEditorMode} roots={roots} repliesOf={repliesOf} refresh={refresh} />
    </section>
  );
}

/** Full-screen comment dialog — the default experience on mobile. */
export function CommentsDialog({
  folderId,
  isEditorMode,
  onClose,
}: {
  folderId: string | null;
  isEditorMode: boolean;
  onClose: () => void;
}) {
  const { roots, repliesOf, total, refresh } = useComments(folderId);

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-vault-hairline bg-vault-menu-bg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-vault-hairline">
          <ChatCircle size={17} className="text-vault-fg-muted" />
          <h2 className="text-sm font-semibold text-vault-fg flex-1">
            Comments {total > 0 && <span className="text-vault-fg-muted">({total})</span>}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-vault-overlay-strong text-vault-fg" aria-label="Close">
            <XIcon size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <Thread folderId={folderId} isEditorMode={isEditorMode} roots={roots} repliesOf={repliesOf} refresh={refresh} />
        </div>
      </div>
    </div>
  );
}

/**
 * Floating comment button. Scrolls to the inline section on desktop, opens the
 * dialog on mobile, and sticks to the top of the screen once the section is in view.
 */
export function CommentsLauncher({
  folderId,
  isEditorMode,
  hidden,
}: {
  folderId: string | null;
  isEditorMode: boolean;
  hidden?: boolean;
}) {
  const [settings] = useUserSettings();
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const [dialog, setDialog] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const q = supabase.from("folder_comments").select("id", { count: "exact", head: true });
      const res = folderId === null ? await q.is("folder_id", null) : await q.eq("folder_id", folderId);
      if (!cancelled) setCount(res.count ?? 0);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [folderId, dialog]);

  useEffect(() => {
    const el = document.getElementById(COMMENTS_ANCHOR_ID);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const open = () => setDialog(true);
    window.addEventListener("vault:open-comments", open);
    return () => window.removeEventListener("vault:open-comments", open);
  }, []);

  if (hidden || !settings.showComments) return null;

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  const activate = () => {
    if (isMobile || settings.commentsAsDialog || inView) {
      setDialog(true);
      return;
    }
    document.getElementById(COMMENTS_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <button
        onClick={activate}
        aria-label="Comments"
        className={
          inView
            ? "fixed left-1/2 -translate-x-1/2 top-3 z-40 inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-vault-menu-bg/95 backdrop-blur border border-vault-hairline text-vault-fg text-xs font-medium shadow-lg transition-all duration-300"
            : "fixed right-4 bottom-24 sm:bottom-6 z-40 inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-vault-fg text-vault-bg text-xs font-semibold shadow-lg hover:opacity-90 transition-all duration-300"
        }
      >
        <ChatCircle size={16} weight="fill" />
        {inView ? "Join the discussion" : "Comments"}
        {count > 0 && (
          <span
            className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              inView ? "bg-vault-overlay-strong text-vault-fg" : "bg-vault-bg/20 text-vault-bg"
            }`}
          >
            {count}
          </span>
        )}
      </button>

      {dialog && (
        <CommentsDialog folderId={folderId} isEditorMode={isEditorMode} onClose={() => setDialog(false)} />
      )}
    </>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { ArrowLeft, LockKey, Pencil, Plus, Trash, Vault } from "@phosphor-icons/react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

const STORAGE_KEY = "assetvault_admin_unlocked";
const ADMIN_PASSWORD = "letmeupload";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlogGate,
});

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  created_at: string;
}

function AdminBlogGate() {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setErr(true);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-vault-bg" />;
  if (unlocked) return <BlogAdmin />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg text-vault-fg p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-vault-overlay border border-vault-hairline rounded-xl p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-vault-overlay-strong">
            <LockKey size={24} weight="fill" />
          </div>
          <h1 className="text-base font-medium">Editor Access</h1>
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false); }}
          autoFocus
          placeholder="Password"
          className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
        />
        {err && <p className="text-xs text-red-400 mt-2">Incorrect password</p>}
        <button type="submit" className="w-full mt-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90">
          Unlock
        </button>
      </form>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function BlogAdmin() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogRow | "new" | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setPosts((data as BlogRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Post deleted");
    void refresh();
  };

  if (editing) {
    return (
      <BlogEditor
        post={editing === "new" ? null : editing}
        onClose={() => { setEditing(null); void refresh(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt=".unExe logo" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold tracking-tight text-sm">Blog admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/admin/letmeupload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs border border-vault-hairline">
              <Vault size={13} /> Vault admin
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-vault-fg-muted">blog</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Posts</h1>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90"
          >
            <Plus size={14} weight="bold" /> New post
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-vault-fg-muted">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-vault-fg-muted">No posts yet — create your first one.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4 rounded-lg border border-vault-hairline bg-vault-overlay">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{p.title}</h3>
                    {!p.published && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-vault-overlay-strong text-vault-fg-muted uppercase tracking-wider">draft</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-vault-fg-muted">
                    <span>/{p.slug}</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    {p.tags?.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="truncate">{p.tags.map((t) => `#${t}`).join(" ")}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate({ to: "/blog/$slug", params: { slug: p.slug } })}
                  className="p-2 rounded hover:bg-vault-overlay-strong text-vault-fg-muted hover:text-vault-fg"
                  title="View"
                >
                  <ArrowLeft size={14} className="rotate-180" />
                </button>
                <button onClick={() => setEditing(p)} className="p-2 rounded hover:bg-vault-overlay-strong text-vault-fg-muted hover:text-vault-fg" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded hover:bg-red-500/20 text-vault-fg-muted hover:text-red-400" title="Delete">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BlogEditor({ post, onClose }: { post: BlogRow | null; onClose: () => void }) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
  const [tagsInput, setTagsInput] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const save = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      cover_url: coverUrl.trim() || null,
      tags,
      published,
    };

    const { error } = isNew
      ? await supabase.from("blogs").insert(payload)
      : await supabase.from("blogs").update(payload).eq("id", post!.id);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? "Post created" : "Post saved");
    onClose();
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs text-vault-fg-muted hover:text-vault-fg">
            <ArrowLeft size={13} /> Back
          </button>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-vault-fg-muted">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Published
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A great title"
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-base focus:outline-none focus:border-vault-fg/40"
          />
        </Field>
        <Field label="Slug" hint="Used in the URL: /blog/your-slug">
          <input
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            placeholder="my-first-post"
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-sm font-mono focus:outline-none focus:border-vault-fg/40"
          />
        </Field>
        <Field label="Cover image URL" hint="Optional">
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
          />
        </Field>
        <Field label="Tags" hint="Comma-separated, e.g. tutorial, behind-the-scenes">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tutorial, drops"
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
          />
        </Field>
        <Field label="Excerpt" hint="Short summary shown on the index page">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
          />
        </Field>
        <Field label="Content">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Write your post here…"
            className="w-full px-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-base font-mono focus:outline-none focus:border-vault-fg/40 leading-relaxed"
          />
        </Field>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wider text-vault-fg-muted">{label}</span>
        {hint && <span className="text-[10px] text-vault-fg-muted/70">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

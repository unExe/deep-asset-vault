import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { ArrowUpRight, MagnifyingGlass, Vault } from "@phosphor-icons/react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — .unExe" },
      { name: "description", content: "Posts, drops, and behind-the-scenes from .unExe." },
      { property: "og:title", content: "Blog — .unExe" },
      { property: "og:description", content: "Posts, drops, and behind-the-scenes from .unExe." },
    ],
  }),
  component: BlogIndex,
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

function BlogIndex() {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts((data as BlogRow[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeTag && !p.tags?.includes(activeTag)) return false;
      if (q && !`${p.title} ${p.excerpt}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [posts, activeTag, q]);

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt=".unExe logo" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold tracking-tight text-sm">.unExe</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/vault" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline">
              <Vault size={13} /> Vault
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-wider text-vault-fg-muted">blog</span>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Notes from .unExe</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-fg-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search posts…"
              className="w-full pl-9 pr-3 py-2 bg-vault-overlay border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
            />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <TagPill active={activeTag === null} onClick={() => setActiveTag(null)} label="All" />
            {allTags.map((t) => (
              <TagPill key={t} active={activeTag === t} onClick={() => setActiveTag(t)} label={`#${t}`} />
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-vault-fg-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-vault-fg-muted">No posts yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group rounded-lg border border-vault-hairline bg-vault-overlay hover:bg-vault-overlay-strong transition-colors overflow-hidden"
              >
                {p.cover_url && (
                  <div className="aspect-video overflow-hidden">
                    <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-vault-fg-muted">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <ArrowUpRight size={14} className="text-vault-fg-muted group-hover:text-vault-fg" />
                  </div>
                  <h2 className="text-base font-semibold mb-1.5 text-vault-fg">{p.title}</h2>
                  {p.excerpt && <p className="text-xs text-vault-fg-muted leading-relaxed line-clamp-3">{p.excerpt}</p>}
                  {p.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-vault-overlay-strong text-vault-fg-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TagPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
        active
          ? "bg-vault-fg text-vault-bg border-vault-fg"
          : "bg-vault-overlay border-vault-hairline text-vault-fg-muted hover:text-vault-fg"
      }`}
    >
      {label}
    </button>
  );
}

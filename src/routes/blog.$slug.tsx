import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { ArrowLeft, Vault } from "@phosphor-icons/react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const [post, setPost] = useState<BlogRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("blogs").select("*").eq("slug", slug).maybeSingle();
      setPost((data as BlogRow | null) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-vault-fg-muted hover:text-vault-fg mb-8">
          <ArrowLeft size={13} /> Back to blog
        </Link>

        {loading ? (
          <p className="text-sm text-vault-fg-muted">Loading…</p>
        ) : !post ? (
          <p className="text-sm text-vault-fg-muted">Post not found.</p>
        ) : (
          <article>
            <div className="text-[11px] uppercase tracking-wider text-vault-fg-muted">
              {new Date(post.created_at).toLocaleDateString()}
            </div>
            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">{post.title}</h1>
            {post.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-vault-overlay-strong text-vault-fg-muted">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {post.cover_url && (
              <div className="mt-8 rounded-xl overflow-hidden border border-vault-hairline">
                <img src={post.cover_url} alt={post.title} className="w-full h-auto" />
              </div>
            )}
            <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-vault-fg/90">{post.content}</div>
          </article>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Trash, Folder as FolderIcon, FileText, ArrowLeft } from "@phosphor-icons/react";
import { Favorites, useFavorites } from "@/lib/favorites";
import { ThemeToggle } from "@/components/vault/ThemeToggle";

export const Route = createFileRoute("/vault/favorites")({
  head: () => ({ meta: [{ title: "Favorites — vault.unExe" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const items = useFavorites();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/85 border-b border-vault-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/vault" className="p-1.5 rounded hover:bg-vault-overlay text-vault-fg-muted">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Star size={16} weight="fill" className="text-vault-accent" />
            <h1 className="text-sm font-medium">Favorites</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {!mounted ? null : items.length === 0 ? (
          <div className="text-center py-24 text-vault-fg-muted">
            <Star size={48} weight="duotone" className="mx-auto opacity-30 mb-3" />
            <p className="text-sm">No favorites yet.</p>
            <p className="text-xs mt-1">Right-click any file or folder in the vault to add it.</p>
            <Link to="/vault" className="inline-block mt-5 px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-xs font-medium">
              Browse vault
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-vault-hairline bg-vault-overlay hover:bg-vault-overlay-strong"
              >
                {f.kind === "folder" ? (
                  <FolderIcon size={20} weight="fill" className="text-vault-folder shrink-0" />
                ) : (
                  <FileText size={20} className="text-vault-fg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-vault-fg truncate">{f.name}</div>
                  <div className="text-[10px] text-vault-fg-muted uppercase tracking-wider">
                    {f.kind} · added {new Date(f.addedAt).toLocaleDateString()}
                  </div>
                </div>
                {f.kind === "folder" && (
                  <Link
                    to="/vault"
                    search={{ folder: f.id } as never}
                    className="text-xs text-vault-fg-muted hover:text-vault-fg px-3 py-1.5 rounded hover:bg-vault-overlay-strong"
                  >
                    Open
                  </Link>
                )}
                <button
                  onClick={() => Favorites.remove(f.id)}
                  className="p-1.5 rounded text-vault-fg-muted hover:bg-vault-danger/15 hover:text-vault-danger"
                  aria-label="Remove"
                >
                  <Trash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

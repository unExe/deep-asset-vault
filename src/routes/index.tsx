import { createFileRoute, Link } from "@tanstack/react-router";
import { YoutubeLogo, TelegramLogo, ArrowUpRight, Vault, Lightning, FilmReel } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/vault/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "unExe" },
      { name: "description", content: "unExe — editor, creator, and the home of vault.unExe." },
      { property: "og:title", content: "unExe" },
      { property: "og:description", content: "Editor & creator. Home of vault.unExe." },
    ],
  }),
  component: HomePage,
});

const YT_URL = "https://youtube.com/@unExe";
const TG_URL = "https://t.me/unExe";

function HomePage() {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-vault-accent" />
            <span className="font-semibold tracking-tight text-sm">unExe</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href={YT_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-vault-fg-muted hover:text-vault-fg">
              YouTube
            </a>
            <a href={TG_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-vault-fg-muted hover:text-vault-fg">
              Telegram
            </a>
            <Link to="/vault" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline">
              <Vault size={13} /> Vault
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-vault-hairline text-[11px] uppercase tracking-wider text-vault-fg-muted">
            <Lightning size={11} weight="fill" /> creator · editor
          </span>
          <h1 className="mt-5 text-5xl sm:text-7xl font-semibold tracking-tight leading-[0.95]">
            unExe.
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg text-vault-fg-muted leading-relaxed">
            Edits, overlays, and breakdowns from the cutting room floor. The vault is where everything lives — drag, drop, download.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <a
              href={YT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <YoutubeLogo size={16} weight="fill" /> Watch on YouTube
              <ArrowUpRight size={13} />
            </a>
            <a
              href={TG_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-sm font-medium border border-vault-hairline"
            >
              <TelegramLogo size={16} weight="fill" /> Join Telegram
              <ArrowUpRight size={13} />
            </a>
            <Link
              to="/vault"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong text-sm font-medium border border-vault-hairline"
            >
              <Vault size={16} /> Open vault
            </Link>
          </div>
        </section>

        {/* Channel info cards */}
        <section className="grid sm:grid-cols-3 gap-3 pb-16">
          <Card icon={<FilmReel size={18} />} title="What's the channel?">
            Long-form edits, overlay packs, and behind-the-scenes for editors who want to actually learn the craft — not just watch it.
          </Card>
          <Card icon={<Vault size={18} />} title="What's the vault?">
            A folder-based asset library. Browse, preview, and download packs the same way you'd open them in your file explorer.
          </Card>
          <Card icon={<TelegramLogo size={18} weight="fill" />} title="Where's the community?">
            Telegram for drops, sneak peeks, and direct lines. YouTube for the work itself.
          </Card>
        </section>

        <footer className="border-t border-vault-hairline py-8 text-xs text-vault-fg-muted flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} unExe</span>
          <div className="flex items-center gap-4">
            <a href={YT_URL} target="_blank" rel="noreferrer" className="hover:text-vault-fg">YouTube</a>
            <a href={TG_URL} target="_blank" rel="noreferrer" className="hover:text-vault-fg">Telegram</a>
            <Link to="/vault" className="hover:text-vault-fg">Vault</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-vault-hairline bg-vault-overlay p-4 sm:p-5">
      <div className="w-9 h-9 rounded-md bg-vault-overlay-strong flex items-center justify-center text-vault-fg mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1.5 text-vault-fg">{title}</h3>
      <p className="text-xs leading-relaxed text-vault-fg-muted">{children}</p>
    </div>
  );
}

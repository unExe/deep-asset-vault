import { createFileRoute, Link } from "@tanstack/react-router";
import {
  YoutubeLogo,
  TelegramLogo,
  ArrowUpRight,
  Vault,
  Lightning,
  FilmReel,
  Folder,
  Download,
  Eye,
  Sparkle,
  PlayCircle,
  ShareNetwork,
  Headphones,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: ".unExe — short-form edits & asset vault" },
      {
        name: "description",
        content:
          ".unExe — short-form creator. Edits, overlays, and the full asset vault for download.",
      },
      { property: "og:title", content: ".unExe — short-form edits & asset vault" },
      {
        property: "og:description",
        content: "Short-form content creator. Browse and download every asset from the vault.",
      },
      { property: "og:image", content: "/og-image.png" },
    ],
  }),
  component: HomePage,
});

const YT_URL = "https://youtube.com/@unexecutable?si=U0GY6Jh7rd_CcrC4";
const TG_URL = "https://t.me/+MMr5_awFb4BkN2E9";

function HomePage() {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt=".unExe logo" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold tracking-tight text-sm">.unExe</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href={YT_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-vault-fg-muted hover:text-vault-fg">YouTube</a>
            <a href={TG_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-vault-fg-muted hover:text-vault-fg">Telegram</a>
            <Link to="/vault" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline">
              <Vault size={13} /> Vault
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-vault-hairline text-[11px] uppercase tracking-wider text-vault-fg-muted">
              <Lightning size={11} weight="fill" /> short-form · creator
            </span>
            <h1 className="mt-5 text-6xl sm:text-8xl font-semibold tracking-tight leading-[0.9]">.unExe</h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-vault-fg-muted leading-relaxed">
              I make short-form content. This site is the home of every asset I use — overlays, sounds, presets, and project files. Browse the vault, preview anything, download what you need.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Link to="/vault" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 transition-opacity">
                <Vault size={16} /> Open the vault <ArrowUpRight size={13} />
              </Link>
              <a href={YT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-sm font-medium border border-vault-hairline">
                <YoutubeLogo size={16} weight="fill" /> Watch <ArrowUpRight size={13} />
              </a>
              <a href={TG_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-vault-overlay hover:bg-vault-overlay-strong text-sm font-medium border border-vault-hairline">
                <TelegramLogo size={16} weight="fill" /> Telegram <ArrowUpRight size={13} />
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <Stat label="Format" value="Shorts" />
              <Stat label="Assets" value="Open" />
              <Stat label="Cost" value="Free" />
            </dl>
          </div>

          {/* Hero visual — logo replaces gradient */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-vault-hairline bg-vault-overlay">
              <img src={logo} alt=".unExe — official logo" className="w-full h-full object-cover" loading="eager" />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/80">
                  <Sparkle size={12} weight="fill" /> latest drop
                </div>
                <p className="mt-1.5 text-white font-medium text-sm">Overlays · transitions · SFX</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-vault-hairline">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-vault-fg-muted">what's inside</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Every asset, organized.</h2>
            </div>
            <Link to="/vault" className="text-sm text-vault-fg-muted hover:text-vault-fg inline-flex items-center gap-1">
              Browse vault <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard icon={<Folder size={18} />} title="Folder structure" desc="Navigate exactly like your file explorer. Nested, searchable, fast." />
            <FeatureCard icon={<Eye size={18} />} title="Instant preview" desc="Click any file to preview images, video, audio, or text in place." />
            <FeatureCard icon={<Download size={18} />} title="One-click download" desc="Single files download direct. Multi-select bundles into a zip." />
            <FeatureCard icon={<ShareNetwork size={18} />} title="Sharable paths" desc="Every folder has a path you can type, copy, and share." />
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-vault-hairline grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-vault-fg-muted">about</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">I'm .unExe.</h2>
            <p className="mt-5 text-vault-fg-muted leading-relaxed">
              I edit short-form content — fast cuts, layered overlays, and sound design built for the scroll. This site exists for one reason: to give you everything I use, in one place, without the Discord-server scavenger hunt.
            </p>
            <p className="mt-4 text-vault-fg-muted leading-relaxed">No paywalls. No watermarks. Just the vault.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <MiniCard icon={<PlayCircle size={18} weight="fill" />} title="Short-form first" desc="Vertical edits built for Shorts, Reels, TikTok." />
            <MiniCard icon={<Headphones size={18} weight="fill" />} title="Sound + visual" desc="Audio cues and overlays designed to land together." />
            <MiniCard icon={<FilmReel size={18} />} title="Open assets" desc="The same files I use in my own edits, available here." />
            <MiniCard icon={<Sparkle size={18} weight="fill" />} title="Always growing" desc="New drops added as I make them. Check the vault often." />
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-vault-hairline">
          <span className="text-[11px] uppercase tracking-wider text-vault-fg-muted">follow</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Where to find me.</h2>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <ChannelCard href={YT_URL} icon={<YoutubeLogo size={22} weight="fill" />} title="YouTube" handle="@unexecutable" desc="The shorts. New uploads regularly." />
            <ChannelCard href={TG_URL} icon={<TelegramLogo size={22} weight="fill" />} title="Telegram" handle="join the channel" desc="Drops, sneak peeks, and direct conversation." />
          </div>
        </section>

        <section className="py-16 sm:py-24 text-center border-t border-vault-hairline">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">Ready to dig in?</h2>
          <p className="mt-4 text-vault-fg-muted max-w-md mx-auto">Open the vault and grab whatever you need.</p>
          <Link to="/vault" className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90">
            <Vault size={16} /> Open vault.unExe <ArrowUpRight size={13} />
          </Link>
        </section>

        <footer className="border-t border-vault-hairline py-8 text-xs text-vault-fg-muted flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} .unExe</span>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-vault-fg-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-vault-fg">{value}</dd>
    </div>
  );
}
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-vault-hairline bg-vault-overlay p-5 hover:bg-vault-overlay-strong transition-colors">
      <div className="w-9 h-9 rounded-md bg-vault-overlay-strong flex items-center justify-center text-vault-fg mb-3">{icon}</div>
      <h3 className="text-sm font-semibold mb-1.5 text-vault-fg">{title}</h3>
      <p className="text-xs leading-relaxed text-vault-fg-muted">{desc}</p>
    </div>
  );
}
function MiniCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-vault-hairline p-4 flex gap-3">
      <div className="text-vault-fg shrink-0 mt-0.5">{icon}</div>
      <div>
        <h4 className="text-sm font-semibold text-vault-fg">{title}</h4>
        <p className="text-xs text-vault-fg-muted mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
function ChannelCard({ href, icon, title, handle, desc }: { href: string; icon: React.ReactNode; title: string; handle: string; desc: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-lg border border-vault-hairline bg-vault-overlay p-5 sm:p-6 hover:bg-vault-overlay-strong transition-colors flex items-start gap-4">
      <div className="w-12 h-12 rounded-md bg-vault-overlay-strong flex items-center justify-center text-vault-fg shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-vault-fg">{title}</h3>
          <ArrowUpRight size={15} className="text-vault-fg-muted group-hover:text-vault-fg" />
        </div>
        <p className="text-xs text-vault-fg-muted mt-0.5 truncate">{handle}</p>
        <p className="text-sm text-vault-fg-muted mt-2 leading-relaxed">{desc}</p>
      </div>
    </a>
  );
}

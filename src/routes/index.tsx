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

const FEATURES = [
  { icon: <Folder size={20} />, title: "Folder structure", desc: "Navigate exactly like your file explorer. Nested, searchable, fast." },
  { icon: <Eye size={20} />, title: "Instant preview", desc: "Click any file to preview images, video, audio, or text in place." },
  { icon: <Download size={20} />, title: "One-click download", desc: "Single files download direct. Multi-select bundles into a zip." },
  { icon: <ShareNetwork size={20} />, title: "Sharable paths", desc: "Every folder has a path you can type, copy, and share." },
  { icon: <Headphones size={20} />, title: "Sound + visual", desc: "Audio cues and overlays designed to land together." },
  { icon: <Sparkle size={20} weight="fill" />, title: "Always growing", desc: "New drops added as I make them. Check the vault often." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg-muted">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt=".unExe logo" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold tracking-tight text-sm text-vault-fg">.unExe</span>
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

      <main>
        {/* Hero */}
        <section className="relative px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 overflow-hidden border-b border-vault-hairline">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--vault-fg)_7%,transparent)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] bg-vault-overlay-strong opacity-40" />

          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 border border-vault-hairline bg-vault-overlay px-3 py-1 rounded-full">
              <span className="font-mono text-[10px] tracking-widest uppercase text-vault-fg-muted inline-flex items-center gap-1.5">
                <Lightning size={10} weight="fill" /> short-form · creator
              </span>
            </div>

            <div className="w-24 h-24 mb-10 rounded-2xl overflow-hidden border border-vault-hairline shadow-[0_0_50px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]">
              <img src={logo} alt=".unExe — official logo" className="w-full h-full object-cover" loading="eager" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-vault-fg tracking-tighter mb-6">
              The Vault<span className="text-vault-fg-muted">.unExe</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed mb-10">
              I make short-form content. Every asset I use — overlays, sounds, presets, project files — lives here. Preview anything, download what you need.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/vault" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-vault-fg text-vault-bg font-semibold text-sm hover:opacity-90 transition-opacity shadow-[0_0_20px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]">
                <Vault size={16} /> Open the vault
              </Link>
              <a href={YT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-vault-overlay border border-vault-hairline text-vault-fg font-semibold text-sm hover:bg-vault-overlay-strong transition-colors">
                <YoutubeLogo size={16} weight="fill" /> Watch <ArrowUpRight size={13} />
              </a>
            </div>

            <dl className="mt-14 grid grid-cols-3 gap-8 sm:gap-14">
              <Stat label="Format" value="Shorts" />
              <Stat label="Assets" value="Open" />
              <Stat label="Cost" value="Free" />
            </dl>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="group relative p-8 rounded-2xl border border-vault-hairline bg-vault-overlay hover:border-vault-fg-muted/40 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--vault-fg)_5%,transparent)_0%,transparent_100%)]" />
                <div className="mb-16 relative z-10 text-vault-fg group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
                <h3 className="text-vault-fg font-semibold mb-2 relative z-10">{f.title}</h3>
                <p className="text-sm leading-relaxed relative z-10">{f.desc}</p>
                <span className="absolute bottom-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-vault-fg-muted">
                  {String(i + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* About & Connect */}
        <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24 border-t border-vault-hairline grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-vault-fg-muted uppercase mb-4 block">Manifesto</span>
            <h2 className="text-3xl font-bold text-vault-fg mb-6 tracking-tight">I'm .unExe.</h2>
            <p className="leading-relaxed">
              I edit short-form content — fast cuts, layered overlays, and sound design built for the scroll. This site exists for one reason: to give you everything I use, in one place, without the Discord-server scavenger hunt.
            </p>
            <p className="mt-4 leading-relaxed">No paywalls. No watermarks. Just the vault.</p>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-mono text-[10px] tracking-widest text-vault-fg-muted uppercase mb-6 block">Connect</span>
            <div className="flex flex-col gap-4">
              <ConnectRow href={YT_URL} icon={<YoutubeLogo size={18} weight="fill" />} label="YouTube" handle="/ @unexecutable" />
              <ConnectRow href={TG_URL} icon={<TelegramLogo size={18} weight="fill" />} label="Telegram" handle="/ join the channel" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniCard icon={<PlayCircle size={18} weight="fill" />} title="Short-form first" desc="Vertical edits for Shorts, Reels, TikTok." />
              <MiniCard icon={<FilmReel size={18} />} title="Open assets" desc="The same files I use in my own edits." />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center">
          <div className="bg-vault-overlay border border-vault-hairline rounded-3xl p-10 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--vault-fg)_6%,transparent)_0%,transparent_100%)]" />
            <h2 className="text-3xl sm:text-4xl font-bold text-vault-fg mb-6 relative z-10 tracking-tight">Ready to unlock the vault?</h2>
            <Link to="/vault" className="relative z-10 inline-flex items-center gap-2 px-10 py-4 bg-vault-fg text-vault-bg font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]">
              <Vault size={16} /> Open vault.unExe <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>

        <footer className="max-w-6xl mx-auto px-6 pt-12 pb-12 border-t border-vault-hairline flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-mono text-[11px] text-vault-fg-muted">© {new Date().getFullYear()} .UNEXE — ALL RIGHTS RESERVED.</span>
          <div className="flex gap-8">
            <a href={YT_URL} target="_blank" rel="noreferrer" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">YouTube</a>
            <a href={TG_URL} target="_blank" rel="noreferrer" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Telegram</a>
            <Link to="/vault" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Vault</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-vault-fg-muted">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold text-vault-fg">{value}</dd>
    </div>
  );
}
function MiniCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-vault-hairline p-4">
      <div className="text-vault-fg mb-2">{icon}</div>
      <h4 className="text-sm font-semibold text-vault-fg">{title}</h4>
      <p className="text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
function ConnectRow({ href, icon, label, handle }: { href: string; icon: React.ReactNode; label: string; handle: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-lg border border-vault-hairline hover:bg-vault-overlay transition-colors group">
      <span className="text-vault-fg inline-flex items-center gap-2.5">{icon} {label}</span>
      <span className="text-vault-fg-muted group-hover:text-vault-fg transition-colors text-sm inline-flex items-center gap-1">{handle} <ArrowUpRight size={13} /></span>
    </a>
  );
}


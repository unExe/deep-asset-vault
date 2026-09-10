import { createFileRoute, Link } from "@tanstack/react-router";
import {
  YoutubeLogo,
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
import { LazyMotion, domAnimation, m, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/vault/ThemeToggle";
import { CursorGlow } from "@/components/home/CursorGlow";
import logo from "@/assets/logo-256.webp";
import { SocialIcon } from "@/lib/social-icons";
import {
  DEFAULT_HERO,
  DEFAULT_SOCIALS,
  fetchSiteSettings,
  fetchContent,
  type FaqItem,
  type HeroSettings,
  type SocialLink,
} from "@/lib/site-settings";

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

const FEATURES = [
  { icon: <Folder size={20} />, title: "Folder structure", desc: "Navigate exactly like your file explorer. Nested, searchable, fast." },
  { icon: <Eye size={20} />, title: "Instant preview", desc: "Click any file to preview images, video, audio, or text in place." },
  { icon: <Download size={20} />, title: "One-click download", desc: "Single files download direct. Multi-select bundles into a zip." },
  { icon: <ShareNetwork size={20} />, title: "Sharable paths", desc: "Every folder has a path you can type, copy, and share." },
  { icon: <Headphones size={20} />, title: "Sound + visual", desc: "Audio cues and overlays designed to land together." },
  { icon: <Sparkle size={20} weight="fill" />, title: "Always growing", desc: "New drops added as I make them. Check the vault often." },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE, delay } },
      }}
    >
      {children}
    </m.div>
  );
}

function socialIcon(icon: string) {
  return <SocialIcon icon={icon} size={18} />;
}

function HomePage() {
  const reduce = useReducedMotion();
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);
  const [socials, setSocials] = useState<SocialLink[]>(DEFAULT_SOCIALS);
  const [faq, setFaq] = useState<FaqItem[]>([]);

  useEffect(() => {
    void fetchSiteSettings().then((s) => {
      setHero(s.hero);
      setSocials(s.socials);
    });
    void fetchContent().then((c) => setFaq(c.faq.filter((f) => f.q.trim())));
  }, []);

  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const heroFade = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.25]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.4]);

  return (
    <LazyMotion features={domAnimation} strict>
    <div className="min-h-screen bg-vault-bg text-vault-fg-muted">
      <CursorGlow />
      {/* Top bar */}
      <m.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="sticky top-0 z-30 backdrop-blur-md bg-vault-bg/80 border-b border-vault-hairline"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <m.img
              src={hero.avatarUrl || logo}
              alt=".unExe logo"
              className="w-7 h-7 rounded-md object-cover"
              width={28}
              height={28}
              decoding="async"
              whileHover={{ rotate: -6, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
            <span className="font-semibold tracking-tight text-sm text-vault-fg">.unExe</span>
          </div>
          <nav className="flex items-center gap-1">
            {socials.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-vault-fg-muted hover:text-vault-fg transition-colors">{s.label}</a>
            ))}
            <m.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link to="/vault" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-vault-overlay-strong hover:bg-vault-card-hover text-xs text-vault-fg border border-vault-hairline">
                <Vault size={13} /> Vault
              </Link>
            </m.div>
            <ThemeToggle />
          </nav>
        </div>
      </m.header>

      <main>
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 overflow-hidden border-b border-vault-hairline"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--vault-fg)_7%,transparent)_0%,transparent_60%)]" />
          <m.div
            style={{ scale: glowScale }}
            animate={reduce ? undefined : { opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] bg-vault-overlay-strong"
          />

          <m.div
            style={{ y: heroY, opacity: heroFade }}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center"
          >
            <m.div variants={rise} className="mb-8 border border-vault-hairline bg-vault-overlay px-3 py-1 rounded-full">
              <span className="font-mono text-[10px] tracking-widest uppercase text-vault-fg-muted inline-flex items-center gap-1.5">
                <m.span
                  animate={reduce ? undefined : { opacity: [1, 0.35, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex"
                >
                  <Lightning size={10} weight="fill" />
                </m.span>
                {hero.badge}
              </span>
            </m.div>

            <m.div
              variants={rise}
              whileHover={{ scale: 1.06, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="w-24 h-24 mb-10 rounded-2xl overflow-hidden border border-vault-hairline shadow-[0_0_50px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]"
            >
              <m.img
                src={hero.avatarUrl || logo}
                alt=".unExe — profile"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={256}
                height={256}
                animate={reduce ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </m.div>

            <m.h1 variants={rise} className="text-5xl md:text-7xl font-bold text-vault-fg tracking-tighter mb-6">
              {hero.title}<span className="text-vault-fg-muted">{hero.titleAccent}</span>
            </m.h1>

            <m.p variants={rise} className="max-w-lg text-lg leading-relaxed mb-10">
              {hero.subtitle}
            </m.p>

            <m.div variants={rise} className="flex flex-wrap justify-center gap-3">
              <m.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Link to="/vault" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-vault-fg text-vault-bg font-semibold text-sm shadow-[0_0_20px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]">
                  <Vault size={16} /> Open the vault
                </Link>
              </m.div>
              <m.a
                href={socials[0]?.url ?? YT_URL}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-vault-overlay border border-vault-hairline text-vault-fg font-semibold text-sm hover:bg-vault-overlay-strong"
              >
                <YoutubeLogo size={16} weight="fill" /> Watch <ArrowUpRight size={13} />
              </m.a>
            </m.div>

            <m.dl variants={rise} className="mt-14 grid grid-cols-3 gap-8 sm:gap-14">
              <Stat label="Format" value="Shorts" />
              <Stat label="Assets" value="Open" />
              <Stat label="Cost" value="Free" />
            </m.dl>
          </m.div>
        </section>

        {/* Feature grid */}
        <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
          <m.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <m.div
                key={f.title}
                variants={rise}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative p-8 rounded-2xl border border-vault-hairline bg-vault-overlay hover:border-vault-fg-muted/40 transition-colors duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--vault-fg)_5%,transparent)_0%,transparent_100%)]" />
                <m.div
                  className="mb-16 relative z-10 text-vault-fg origin-left"
                  whileHover={{ scale: 1.15, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                >
                  {f.icon}
                </m.div>
                <h3 className="text-vault-fg font-semibold mb-2 relative z-10">{f.title}</h3>
                <p className="text-sm leading-relaxed relative z-10">{f.desc}</p>
                <span className="absolute bottom-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-vault-fg-muted">
                  {String(i + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                </span>
                <m.span
                  className="absolute left-0 bottom-0 h-px bg-vault-fg/40"
                  initial={{ width: "0%" }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </m.div>
            ))}
          </m.div>
        </section>

        {/* About & Connect */}
        <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24 border-t border-vault-hairline grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <Reveal>
            <span className="font-mono text-[10px] tracking-widest text-vault-fg-muted uppercase mb-4 block">Manifesto</span>
            <h2 className="text-3xl font-bold text-vault-fg mb-6 tracking-tight">I'm .unExe.</h2>
            <p className="leading-relaxed">
              I edit short-form content — fast cuts, layered overlays, and sound design built for the scroll. This site exists for one reason: to give you everything I use, in one place, without the Discord-server scavenger hunt.
            </p>
            <p className="mt-4 leading-relaxed">No paywalls. No watermarks. Just the vault.</p>
          </Reveal>
          <Reveal delay={0.12} className="flex flex-col justify-center">
            <span className="font-mono text-[10px] tracking-widest text-vault-fg-muted uppercase mb-6 block">Connect</span>
            <div className="flex flex-col gap-4">
              {socials.map((s) => (
                <ConnectRow key={s.id} href={s.url} icon={socialIcon(s.icon)} label={s.label} handle={s.handle} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniCard icon={<PlayCircle size={18} weight="fill" />} title="Short-form first" desc="Vertical edits for Shorts, Reels, TikTok." />
              <MiniCard icon={<FilmReel size={18} />} title="Open assets" desc="The same files I use in my own edits." />
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="text-2xl sm:text-3xl font-bold text-vault-fg tracking-tight mb-6">
                Frequently asked
              </h2>
              <div className="space-y-3">
                {faq.map((f) => (
                  <details
                    key={f.id}
                    className="rounded-xl border border-vault-hairline bg-vault-overlay p-4"
                  >
                    <summary className="cursor-pointer text-sm font-medium text-vault-fg select-none">
                      {f.q}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-vault-fg-muted whitespace-pre-line">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 sm:py-24 text-center">
          <Reveal>
            <div className="bg-vault-overlay border border-vault-hairline rounded-3xl p-10 sm:p-12 relative overflow-hidden">
              <m.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--vault-fg)_6%,transparent)_0%,transparent_100%)]"
                animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <h2 className="text-3xl sm:text-4xl font-bold text-vault-fg mb-6 relative z-10 tracking-tight">Ready to unlock the vault?</h2>
              <m.div
                className="relative z-10 inline-block"
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
              >
                <Link to="/vault" className="inline-flex items-center gap-2 px-10 py-4 bg-vault-fg text-vault-bg font-bold rounded-xl shadow-[0_0_30px_color-mix(in_oklab,var(--vault-fg)_12%,transparent)]">
                  <Vault size={16} /> Open vault.unExe <ArrowUpRight size={13} />
                </Link>
              </m.div>
            </div>
          </Reveal>
        </section>

        <footer className="max-w-6xl mx-auto px-6 pt-12 pb-12 border-t border-vault-hairline flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-mono text-[11px] text-vault-fg-muted">© {new Date().getFullYear()} .UNEXE — ALL RIGHTS RESERVED.</span>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors"
              >
                <SocialIcon icon={s.icon} size={13} /> {s.label}
              </a>
            ))}
            <Link to="/vault" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Vault</Link>
            <Link to="/terms" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Terms</Link>
            <Link to="/privacy" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Privacy</Link>
            <Link to="/cookies" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Cookies</Link>
            <Link to="/support" className="text-[11px] font-mono uppercase text-vault-fg-muted hover:text-vault-fg transition-colors">Support</Link>
          </div>
        </footer>
      </main>
    </div>
    </LazyMotion>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <m.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-vault-fg-muted">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold text-vault-fg">{value}</dd>
    </m.div>
  );
}
function MiniCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <m.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="rounded-lg border border-vault-hairline p-4"
    >
      <div className="text-vault-fg mb-2">{icon}</div>
      <h4 className="text-sm font-semibold text-vault-fg">{title}</h4>
      <p className="text-xs mt-1 leading-relaxed">{desc}</p>
    </m.div>
  );
}
function ConnectRow({ href, icon, label, handle }: { href: string; icon: React.ReactNode; label: string; handle: string }) {
  return (
    <m.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ x: 6 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className="flex items-center justify-between p-4 rounded-lg border border-vault-hairline hover:bg-vault-overlay transition-colors group"
    >
      <span className="text-vault-fg inline-flex items-center gap-2.5">{icon} {label}</span>
      <span className="text-vault-fg-muted group-hover:text-vault-fg transition-colors text-sm inline-flex items-center gap-1">{handle} <ArrowUpRight size={13} /></span>
    </m.a>
  );
}

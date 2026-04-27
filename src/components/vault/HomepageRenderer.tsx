import { Link } from "@tanstack/react-router";
import { ArrowUpRight, YoutubeLogo, TelegramLogo, Vault } from "@phosphor-icons/react";
import type { BlockRow } from "@/lib/homepage-blocks";

export function HomepageRenderer({ blocks }: { blocks: BlockRow[] }) {
  return (
    <>
      {blocks.map((b) => {
        const d = b.data as Record<string, unknown>;
        const s = (k: string) => (d[k] as string | undefined) ?? "";
        switch (b.block_type) {
          case "hero":
            return (
              <section key={b.id} className="pt-12 sm:pt-20 pb-12 sm:pb-16">
                {s("eyebrow") && (
                  <span className="inline-flex px-2.5 py-1 rounded-full border border-vault-hairline text-[11px] uppercase tracking-wider text-vault-fg-muted">
                    {s("eyebrow")}
                  </span>
                )}
                <h1 className="mt-5 text-5xl sm:text-7xl font-semibold tracking-tight">{s("title")}</h1>
                {s("body") && <p className="mt-5 max-w-xl text-base text-vault-fg-muted leading-relaxed">{s("body")}</p>}
                {s("ctaLabel") && s("ctaUrl") && (
                  <CtaLink url={s("ctaUrl")} label={s("ctaLabel")} primary />
                )}
              </section>
            );
          case "text":
            return (
              <section key={b.id} className="py-10 sm:py-14 border-t border-vault-hairline">
                {s("heading") && <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{s("heading")}</h2>}
                {s("body") && <p className="mt-4 text-vault-fg-muted leading-relaxed whitespace-pre-wrap">{s("body")}</p>}
              </section>
            );
          case "channels":
            return (
              <section key={b.id} className="py-10 sm:py-14 border-t border-vault-hairline grid sm:grid-cols-2 gap-3">
                {s("youtube") && <ChannelCard href={s("youtube")} icon={<YoutubeLogo size={22} weight="fill" />} title="YouTube" />}
                {s("telegram") && <ChannelCard href={s("telegram")} icon={<TelegramLogo size={22} weight="fill" />} title="Telegram" />}
              </section>
            );
          case "feature_grid": {
            const items = (d.items as { title: string; desc: string }[]) ?? [];
            return (
              <section key={b.id} className="py-10 sm:py-14 border-t border-vault-hairline">
                {s("heading") && <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">{s("heading")}</h2>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {items.map((it, i) => (
                    <div key={i} className="rounded-lg border border-vault-hairline bg-vault-overlay p-5">
                      <h3 className="text-sm font-semibold text-vault-fg">{it.title}</h3>
                      <p className="text-xs leading-relaxed text-vault-fg-muted mt-1.5">{it.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case "stats": {
            const items = (d.items as { label: string; value: string }[]) ?? [];
            return (
              <section key={b.id} className="py-8 border-t border-vault-hairline">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {items.map((it, i) => (
                    <div key={i}>
                      <dt className="text-[11px] uppercase tracking-wider text-vault-fg-muted">{it.label}</dt>
                      <dd className="mt-1 text-lg font-semibold text-vault-fg">{it.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          }
          case "image":
            return s("url") ? (
              <section key={b.id} className="py-10 border-t border-vault-hairline">
                <img src={s("url")} alt={s("alt")} className="w-full rounded-lg border border-vault-hairline" />
                {s("caption") && <p className="text-xs text-vault-fg-muted mt-2 text-center">{s("caption")}</p>}
              </section>
            ) : null;
          case "cta":
            return (
              <section key={b.id} className="py-14 sm:py-20 text-center border-t border-vault-hairline">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{s("title")}</h2>
                {s("body") && <p className="mt-3 text-vault-fg-muted max-w-md mx-auto">{s("body")}</p>}
                {s("ctaLabel") && s("ctaUrl") && (
                  <div className="mt-6"><CtaLink url={s("ctaUrl")} label={s("ctaLabel")} primary /></div>
                )}
              </section>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function CtaLink({ url, label, primary }: { url: string; label: string; primary?: boolean }) {
  const cls = primary
    ? "inline-flex items-center gap-2 px-5 py-3 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 mt-6"
    : "inline-flex items-center gap-2 px-5 py-3 rounded-md border border-vault-hairline text-sm font-medium mt-6";
  if (url.startsWith("/")) {
    return (
      <Link to={url} className={cls}>
        <Vault size={16} /> {label} <ArrowUpRight size={13} />
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className={cls}>
      {label} <ArrowUpRight size={13} />
    </a>
  );
}

function ChannelCard({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group rounded-lg border border-vault-hairline bg-vault-overlay p-5 hover:bg-vault-overlay-strong flex items-center gap-4">
      <div className="w-12 h-12 rounded-md bg-vault-overlay-strong flex items-center justify-center text-vault-fg shrink-0">{icon}</div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-vault-fg">{title}</h3>
        <p className="text-xs text-vault-fg-muted truncate">{href}</p>
      </div>
      <ArrowUpRight size={15} className="text-vault-fg-muted group-hover:text-vault-fg" />
    </a>
  );
}

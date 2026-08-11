import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChartLine,
  FloppyDisk,
  Image as ImageIcon,
  LinkSimple,
  Plus,
  ShieldCheck,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { AdminGate } from "@/components/admin/AdminGate";
import { IconPicker, SocialIcon } from "@/lib/social-icons";
import {
  DEFAULT_HERO,
  DEFAULT_SOCIALS,
  fetchSiteSettings,
  type HeroSettings,
  type SocialLink,
} from "@/lib/site-settings";
import {
  aAnalytics,
  aChangePassword,
  aChangePetAnswer,
  aSetSetting,
  aUploadFile,
  storagePath,
} from "@/lib/admin-api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/unexe")({
  head: () => ({
    meta: [
      { title: "Admin — vault.unExe" },
      { name: "description", content: "Manage links, profile picture, hero copy and analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminGate title="Admin Access">
      <AdminPanel />
    </AdminGate>
  ),
});

type Tab = "hero" | "links" | "analytics" | "security";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "hero", label: "Hero & profile", icon: <ImageIcon size={15} /> },
  { id: "links", label: "Social links", icon: <LinkSimple size={15} /> },
  { id: "analytics", label: "Analytics", icon: <ChartLine size={15} /> },
  { id: "security", label: "Security", icon: <ShieldCheck size={15} /> },
];

const inputCls =
  "w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg focus:outline-none focus:border-vault-fg/40";
const cardCls = "rounded-xl border border-vault-hairline bg-vault-overlay p-6";
const btnCls =
  "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50";
const ghostBtnCls =
  "inline-flex items-center gap-2 px-3 py-2 rounded-md border border-vault-hairline text-sm text-vault-fg hover:bg-vault-overlay-strong transition-colors";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("hero");
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);
  const [socials, setSocials] = useState<SocialLink[]>(DEFAULT_SOCIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchSiteSettings().then((s) => {
      setHero(s.hero);
      setSocials(s.socials);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-vault-bg text-vault-fg">
      <header className="sticky top-0 z-20 border-b border-vault-hairline bg-vault-bg/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className={ghostBtnCls}>
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Site</span>
            </Link>
            <h1 className="text-sm font-semibold truncate">Admin · vault.unExe</h1>
          </div>
          <Link to="/admin/letmeupload" className={ghostBtnCls}>
            Vault editor
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-vault-fg text-vault-fg"
                  : "border-transparent text-vault-fg-muted hover:text-vault-fg"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <p className="text-sm text-vault-fg-muted">Loading…</p>
        ) : (
          <>
            {tab === "hero" && <HeroEditor hero={hero} setHero={setHero} />}
            {tab === "links" && <LinksEditor socials={socials} setSocials={setSocials} />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "security" && <SecurityPanel />}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------- Hero & pic ------------------------------- */

function HeroEditor({
  hero,
  setHero,
}: {
  hero: HeroSettings;
  setHero: (h: HeroSettings) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await aSetSetting("hero", hero);
      toast.success("Hero updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const path = storagePath("profile", file.name);
      await aUploadFile(path, file, file.type);
      const url = supabase.storage.from("assets").getPublicUrl(path).data.publicUrl;
      setHero({ ...hero, avatarUrl: url });
      await aSetSetting("hero", { ...hero, avatarUrl: url });
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={cardCls}>
        <h2 className="text-sm font-semibold mb-4">Profile picture</h2>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-vault-hairline bg-vault-overlay-strong flex items-center justify-center">
            {hero.avatarUrl ? (
              <img src={hero.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={22} className="text-vault-fg-muted" />
            )}
          </div>
          <div className="space-y-2">
            <label className={btnCls + " cursor-pointer"}>
              <UploadSimple size={15} />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              value={hero.avatarUrl}
              onChange={(e) => setHero({ ...hero, avatarUrl: e.target.value })}
              placeholder="…or paste an image URL"
              className={inputCls + " min-w-[260px]"}
            />
          </div>
        </div>
      </section>

      <section className={cardCls + " space-y-4"}>
        <h2 className="text-sm font-semibold">Hero text</h2>
        <Field label="Badge">
          <input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Title accent">
            <input
              value={hero.titleAccent}
              onChange={(e) => setHero({ ...hero, titleAccent: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Subtitle">
          <textarea
            value={hero.subtitle}
            onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
            rows={4}
            className={inputCls}
          />
        </Field>
        <button onClick={() => void save()} disabled={saving} className={btnCls}>
          <FloppyDisk size={15} /> {saving ? "Saving…" : "Save hero"}
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-vault-fg-muted">{label}</span>
      {children}
    </label>
  );
}

/* --------------------------------- Links --------------------------------- */

function LinksEditor({
  socials,
  setSocials,
}: {
  socials: SocialLink[];
  setSocials: (s: SocialLink[]) => void;
}) {
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<SocialLink>) => {
    setSocials(socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const save = async () => {
    const invalid = socials.find((s) => !/^https?:\/\/|^mailto:/.test(s.url.trim()));
    if (invalid) {
      toast.error(`"${invalid.label || "Link"}" needs a valid URL (https://…)`);
      return;
    }
    setSaving(true);
    try {
      await aSetSetting("socials", socials);
      toast.success("Links updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={cardCls + " space-y-4"}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Social links</h2>
        <button
          className={ghostBtnCls}
          onClick={() =>
            setSocials([
              ...socials,
              { id: crypto.randomUUID(), label: "", handle: "", url: "", icon: "link" },
            ])
          }
        >
          <Plus size={14} /> Add link
        </button>
      </div>

      {socials.length === 0 && <p className="text-sm text-vault-fg-muted">No links yet.</p>}

      <div className="space-y-3">
        {socials.map((s, i) => (
          <div key={s.id} className="border border-vault-hairline rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1.4fr_auto] gap-2 items-center">
              <span className="w-9 h-9 shrink-0 grid place-items-center rounded-md border border-vault-hairline bg-vault-bg text-vault-fg">
                <SocialIcon icon={s.icon} size={17} />
              </span>
              <input
                value={s.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label (YouTube)"
                className={inputCls}
              />
              <input
                value={s.handle}
                onChange={(e) => update(i, { handle: e.target.value })}
                placeholder="Handle (/ @unexe)"
                className={inputCls}
              />
              <input
                value={s.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                className={inputCls}
              />
              <button
                onClick={() => setSocials(socials.filter((_, idx) => idx !== i))}
                className="p-2 rounded-md text-red-400 hover:bg-red-500/10 justify-self-start"
                aria-label="Remove link"
              >
                <Trash size={16} />
              </button>
            </div>
            <details className="group">
              <summary className="text-xs text-vault-fg-muted cursor-pointer hover:text-vault-fg select-none">
                Icon — <span className="font-mono">{s.icon}</span> (click to change)
              </summary>
              <div className="mt-2">
                <IconPicker value={s.icon} onChange={(icon) => update(i, { icon })} />
              </div>
            </details>
          </div>
        ))}
      </div>

      <button onClick={() => void save()} disabled={saving} className={btnCls}>
        <FloppyDisk size={15} /> {saving ? "Saving…" : "Save links"}
      </button>
    </section>
  );
}

/* -------------------------------- Analytics ------------------------------- */

type Stats = Awaited<ReturnType<typeof aAnalytics>>;

function AnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setStats(null);
    setErr(null);
    void aAnalytics(days)
      .then(setStats)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [days]);

  const max = useMemo(
    () => Math.max(1, ...(stats?.byDay ?? []).map((d) => d.views)),
    [stats],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
              days === d
                ? "bg-vault-fg text-vault-bg border-vault-fg"
                : "border-vault-hairline text-vault-fg-muted hover:text-vault-fg"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
      {!stats && !err && <p className="text-sm text-vault-fg-muted">Loading analytics…</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Page views" value={stats.totalViews} />
            <Stat label="Unique visitors" value={stats.uniqueVisitors} />
            <Stat
              label="Avg views / day"
              value={Math.round((stats.totalViews / days) * 10) / 10}
            />
          </div>

          <section className={cardCls}>
            <h2 className="text-sm font-semibold mb-4">Views per day</h2>
            {stats.byDay.length === 0 ? (
              <p className="text-sm text-vault-fg-muted">No data yet.</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {stats.byDay.map((d) => (
                  <div key={d.day} className="flex-1 group relative flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-vault-fg/70 group-hover:bg-vault-fg rounded-t-sm transition-colors"
                      style={{ height: `${(d.views / max) * 100}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] font-mono bg-vault-overlay-strong border border-vault-hairline rounded px-1.5 py-0.5 whitespace-nowrap">
                      {d.day} · {d.views}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <TopList title="Top pages" rows={stats.topPaths} />
            <TopList title="Top referrers" rows={stats.topReferrers} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={cardCls}>
      <p className="text-xs text-vault-fg-muted">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  return (
    <section className={cardCls}>
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-vault-fg-muted">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-vault-fg-muted">{r.name}</span>
              <span className="font-mono text-xs">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------- Security -------------------------------- */

function SecurityPanel() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [petCur, setPetCur] = useState("");
  const [pet, setPet] = useState("");

  const changePw = async () => {
    try {
      await aChangePassword(cur, next);
      setCur("");
      setNext("");
      toast.success("Password changed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const changePet = async () => {
    try {
      await aChangePetAnswer(petCur, pet);
      setPetCur("");
      setPet("");
      toast.success("Recovery answer updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className={cardCls + " space-y-4"}>
        <h2 className="text-sm font-semibold">Change password</h2>
        <Field label="Current password">
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} />
        </Field>
        <Field label="New password (min 6 chars)">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        </Field>
        <button onClick={() => void changePw()} disabled={!cur || next.length < 6} className={btnCls}>
          Update password
        </button>
      </section>

      <section className={cardCls + " space-y-4"}>
        <h2 className="text-sm font-semibold">Recovery question — “Pet name?”</h2>
        <p className="text-xs text-vault-fg-muted">
          Used on the unlock screen via “Forgot password?” to reset the password without the old one.
        </p>
        <Field label="Current password">
          <input type="password" value={petCur} onChange={(e) => setPetCur(e.target.value)} className={inputCls} />
        </Field>
        <Field label="New pet name answer">
          <input value={pet} onChange={(e) => setPet(e.target.value)} className={inputCls} />
        </Field>
        <button onClick={() => void changePet()} disabled={!petCur || !pet.trim()} className={ghostBtnCls}>
          Update answer
        </button>
      </section>
    </div>
  );
}

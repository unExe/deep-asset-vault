import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Preferences — vault.unExe" },
      {
        name: "description",
        content: "Choose what vault.unExe may store in your browser, or clear it all in one click.",
      },
      { property: "og:title", content: "Cookie Preferences — vault.unExe" },
      {
        property: "og:description",
        content: "Choose what vault.unExe may store in your browser, or clear it all in one click.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://deep-asset-vault.lovable.app/cookies" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deep-asset-vault.lovable.app/cookies" }],
  }),
  component: CookiesPage,
});

export const COOKIE_PREFS_KEY = "vault.cookie.prefs";

export type CookiePrefs = { analytics: boolean; preferences: boolean };
const DEFAULTS: CookiePrefs = { analytics: true, preferences: true };

export function readCookiePrefs(): CookiePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(COOKIE_PREFS_KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

function CookiesPage() {
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULTS);

  useEffect(() => setPrefs(readCookiePrefs()), []);

  const update = (patch: Partial<CookiePrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("vault:cookie-prefs-changed"));
    toast.success("Preferences saved");
  };

  const clearAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* storage may be blocked */
    }
    toast.success("Everything stored in this browser has been cleared");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <PageShell
      title="Cookie Preferences"
      intro="This site uses no advertising cookies. Everything below is stored locally in your browser and you can switch it off at any time."
    >
      <Section heading="Strictly necessary">
        <Row
          label="Essential"
          desc="Keeps the admin unlock session and basic site function working. Cannot be disabled."
          checked
          disabled
        />
      </Section>
      <Section heading="Optional">
        <Row
          label="Anonymous visit statistics"
          desc="A random ID so repeat visits are not double-counted. No personal data."
          checked={prefs.analytics}
          onChange={(v) => update({ analytics: v })}
        />
        <Row
          label="Preferences"
          desc="Remembers your theme, favourites, keyboard shortcuts and read announcements."
          checked={prefs.preferences}
          onChange={(v) => update({ preferences: v })}
        />
      </Section>
      <Section heading="Clear everything">
        <p>
          Removes all preferences, favourites and stored IDs from this browser. This cannot be
          undone.
        </p>
        <button
          onClick={clearAll}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
        >
          Clear stored data
        </button>
      </Section>
    </PageShell>
  );
}

function Row({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border border-vault-hairline bg-vault-overlay p-4 ${
        disabled ? "opacity-60" : "cursor-pointer hover:bg-vault-overlay-strong transition-colors"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-current"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-vault-fg">{label}</span>
        <span className="block text-xs">{desc}</span>
      </span>
    </label>
  );
}

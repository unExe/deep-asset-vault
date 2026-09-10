import { supabase } from "@/integrations/supabase/client";

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  url: string;
  icon: string;
};

export type HeroSettings = {
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  avatarUrl: string;
};

export const DEFAULT_HERO: HeroSettings = {
  badge: "short-form · creator",
  title: "The Vault",
  titleAccent: ".unExe",
  subtitle:
    "I make short-form content. Every asset I use — overlays, sounds, presets, project files — lives here. Preview anything, download what you need.",
  avatarUrl: "",
};

export const DEFAULT_SOCIALS: SocialLink[] = [
  {
    id: "yt",
    label: "YouTube",
    handle: "/ @unexecutable",
    url: "https://youtube.com/@unexecutable?si=U0GY6Jh7rd_CcrC4",
    icon: "youtube",
  },
  {
    id: "tg",
    label: "Telegram",
    handle: "/ join the channel",
    url: "https://t.me/+MMr5_awFb4BkN2E9",
    icon: "telegram",
  },
];

/** Icon keys offered in the admin link editor. */
export const ICON_OPTIONS = [
  "youtube",
  "telegram",
  "instagram",
  "tiktok",
  "x",
  "discord",
  "github",
  "twitch",
  "reddit",
  "linkedin",
  "spotify",
  "envelope",
  "link",
] as const;

export type BrandingSettings = {
  siteTitle: string;
  tagline: string;
  description: string;
  faviconUrl: string;
  bannerUrl: string;
  tooltip: string;
  maintenance: boolean;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  siteTitle: "vault.unExe",
  tagline: "creator hub & vault",
  description: "unExe — videos, drops, and the editor vault.",
  faviconUrl: "",
  bannerUrl: "",
  tooltip: "unExe — the editor vault",
  maintenance: false,
};

export async function fetchBranding(): Promise<BrandingSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "branding")
    .maybeSingle();
  return { ...DEFAULT_BRANDING, ...((data?.value as Partial<BrandingSettings>) ?? {}) };
}

export type FaqItem = { id: string; q: string; a: string };

export type ContentSettings = {
  faq: FaqItem[];
  terms: string;
  privacy: string;
  cookies: string;
  supportIntro: string;
  /** Shown publicly on the support page. Leave empty to hide. */
  supportEmail: string;
  /** Private — never rendered. Where request notifications should go. */
  notifyEmail: string;
};

export const DEFAULT_CONTENT: ContentSettings = {
  faq: [],
  terms: "",
  privacy: "",
  cookies: "",
  supportIntro: "",
  supportEmail: "",
  notifyEmail: "",
};

export async function fetchContent(): Promise<ContentSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "content")
    .maybeSingle();
  const v = (data?.value as Partial<ContentSettings>) ?? {};
  return { ...DEFAULT_CONTENT, ...v, faq: Array.isArray(v.faq) ? v.faq : [] };
}

export async function fetchSiteSettings(): Promise<{
  hero: HeroSettings;
  socials: SocialLink[];
}> {
  const { data } = await supabase.from("site_settings").select("key, value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const hero = { ...DEFAULT_HERO, ...((map.get("hero") as Partial<HeroSettings>) ?? {}) };
  const rawSocials = map.get("socials");
  const socials = Array.isArray(rawSocials) ? (rawSocials as SocialLink[]) : DEFAULT_SOCIALS;
  return { hero, socials };
}

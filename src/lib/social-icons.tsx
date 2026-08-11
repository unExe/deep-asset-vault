import {
  YoutubeLogo,
  TelegramLogo,
  InstagramLogo,
  TiktokLogo,
  XLogo,
  DiscordLogo,
  GithubLogo,
  TwitchLogo,
  RedditLogo,
  LinkedinLogo,
  SpotifyLogo,
  Envelope,
  LinkSimple,
  GlobeSimple,
  PatreonLogo,
  SoundcloudLogo,
  PinterestLogo,
  WhatsappLogo,
  FacebookLogo,
  DribbbleLogo,
  BehanceLogo,
  MediumLogo,
  ThreadsLogo,
  SnapchatLogo,
  Coffee,
  ShoppingBag,
  Article,
  Camera,
  MusicNotes,
  FilmReel,
  Sparkle,
  Heart,
  Star,
  Lightning,
  Vault,
  Chat,
  type Icon,
} from "@phosphor-icons/react";

/** Every icon a link can use in the admin panel. */
export const SOCIAL_ICONS: Record<string, Icon> = {
  youtube: YoutubeLogo,
  telegram: TelegramLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  x: XLogo,
  discord: DiscordLogo,
  github: GithubLogo,
  twitch: TwitchLogo,
  reddit: RedditLogo,
  linkedin: LinkedinLogo,
  spotify: SpotifyLogo,
  soundcloud: SoundcloudLogo,
  patreon: PatreonLogo,
  pinterest: PinterestLogo,
  whatsapp: WhatsappLogo,
  facebook: FacebookLogo,
  threads: ThreadsLogo,
  snapchat: SnapchatLogo,
  dribbble: DribbbleLogo,
  behance: BehanceLogo,
  medium: MediumLogo,
  envelope: Envelope,
  website: GlobeSimple,
  link: LinkSimple,
  coffee: Coffee,
  shop: ShoppingBag,
  blog: Article,
  camera: Camera,
  music: MusicNotes,
  film: FilmReel,
  sparkle: Sparkle,
  heart: Heart,
  star: Star,
  lightning: Lightning,
  vault: Vault,
  chat: Chat,
};

export const SOCIAL_ICON_KEYS = Object.keys(SOCIAL_ICONS);

const FILLED = new Set([
  "youtube",
  "telegram",
  "instagram",
  "tiktok",
  "discord",
  "twitch",
  "reddit",
  "linkedin",
  "spotify",
  "facebook",
  "whatsapp",
  "heart",
  "star",
  "sparkle",
  "lightning",
]);

/** Render a link icon by its key, falling back to a generic link glyph. */
export function SocialIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const Cmp = SOCIAL_ICONS[icon] ?? LinkSimple;
  return <Cmp size={size} weight={FILLED.has(icon) ? "fill" : "regular"} />;
}

/** Grid picker used in the admin link editor. */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-40 overflow-y-auto p-2 rounded-md border border-vault-hairline bg-vault-bg">
      {SOCIAL_ICON_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          title={key}
          aria-label={key}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`flex items-center justify-center aspect-square rounded-md border transition-colors ${
            value === key
              ? "border-vault-fg bg-vault-fg text-vault-bg"
              : "border-vault-hairline text-vault-fg-muted hover:text-vault-fg hover:bg-vault-overlay-strong"
          }`}
        >
          <SocialIcon icon={key} size={16} />
        </button>
      ))}
    </div>
  );
}

/** Homepage block schema + helpers shared between builder and renderer. */
import { supabase } from "@/integrations/supabase/client";

export type BlockType =
  | "hero"
  | "text"
  | "channels"
  | "feature_grid"
  | "stats"
  | "image"
  | "cta";

export interface HeroData { eyebrow?: string; title?: string; body?: string; ctaLabel?: string; ctaUrl?: string; }
export interface TextData { heading?: string; body?: string; }
export interface ChannelsData { youtube?: string; telegram?: string; }
export interface FeatureGridData { heading?: string; items?: { title: string; desc: string }[]; }
export interface StatsData { items?: { label: string; value: string }[]; }
export interface ImageData { url?: string; alt?: string; caption?: string; }
export interface CtaData { title?: string; body?: string; ctaLabel?: string; ctaUrl?: string; }

export interface BlockRow {
  id: string;
  block_type: BlockType;
  position: number;
  data: Record<string, unknown>;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  text: "Text section",
  channels: "Channels (YT + TG)",
  feature_grid: "Feature grid",
  stats: "Stats row",
  image: "Image",
  cta: "Call to action",
};

export const DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  hero: { eyebrow: "short-form · creator", title: ".unExe", body: "Edits, overlays, and the full asset vault.", ctaLabel: "Open the vault", ctaUrl: "/vault" },
  text: { heading: "About", body: "Tell your story here." },
  channels: { youtube: "https://youtube.com/@unexecutable", telegram: "https://t.me/+MMr5_awFb4BkN2E9" },
  feature_grid: { heading: "Features", items: [
    { title: "Folders", desc: "Navigate like a file explorer." },
    { title: "Preview", desc: "Image, video, audio in place." },
    { title: "Download", desc: "One click. Bulk zips supported." },
    { title: "Free", desc: "No paywalls or signup." },
  ] },
  stats: { items: [
    { label: "Format", value: "Shorts" },
    { label: "Assets", value: "Open" },
    { label: "Cost", value: "Free" },
  ] },
  image: { url: "", alt: "", caption: "" },
  cta: { title: "Ready to dig in?", body: "Open the vault and grab whatever you need.", ctaLabel: "Open vault.unExe", ctaUrl: "/vault" },
};

export async function loadBlocks(): Promise<BlockRow[]> {
  const { data } = await supabase
    .from("homepage_blocks")
    .select("*")
    .order("position", { ascending: true });
  return (data as BlockRow[] | null) ?? [];
}

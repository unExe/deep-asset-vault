
-- 1. folders: add sidebar_pinned + info_md
ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS sidebar_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS info_md text NOT NULL DEFAULT '';

-- 2. assets: track timestamps for date uploaded/edited
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Auto-update assets.updated_at on update
CREATE OR REPLACE FUNCTION public.touch_assets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_assets_touch ON public.assets;
CREATE TRIGGER trg_assets_touch
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.touch_assets_updated_at();

-- 3. Per-visitor view/download tracking
CREATE TABLE IF NOT EXISTS public.asset_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  visitor_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('view','download')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, visitor_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_asset_events_asset ON public.asset_events(asset_id);

ALTER TABLE public.asset_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read asset_events" ON public.asset_events FOR SELECT USING (true);
CREATE POLICY "anyone insert asset_events" ON public.asset_events FOR INSERT WITH CHECK (true);

-- 4. Folder comments (public, no auth)
CREATE TABLE IF NOT EXISTS public.folder_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid,
  name text NOT NULL,
  email text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folder_comments_folder ON public.folder_comments(folder_id);

ALTER TABLE public.folder_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read comments" ON public.folder_comments FOR SELECT USING (true);
CREATE POLICY "anyone insert comments" ON public.folder_comments FOR INSERT WITH CHECK (
  length(trim(name)) > 0 AND length(name) <= 80
  AND length(trim(body)) > 0 AND length(body) <= 2000
  AND (email IS NULL OR length(email) <= 200)
);
CREATE POLICY "anyone delete comments" ON public.folder_comments FOR DELETE USING (true);

-- 5. Homepage blocks for the builder
CREATE TABLE IF NOT EXISTS public.homepage_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_pos ON public.homepage_blocks(position);

ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read homepage_blocks" ON public.homepage_blocks FOR SELECT USING (true);
CREATE POLICY "anyone insert homepage_blocks" ON public.homepage_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update homepage_blocks" ON public.homepage_blocks FOR UPDATE USING (true);
CREATE POLICY "anyone delete homepage_blocks" ON public.homepage_blocks FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.touch_blocks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_homepage_blocks_touch ON public.homepage_blocks;
CREATE TRIGGER trg_homepage_blocks_touch
BEFORE UPDATE ON public.homepage_blocks
FOR EACH ROW EXECUTE FUNCTION public.touch_blocks_updated_at();

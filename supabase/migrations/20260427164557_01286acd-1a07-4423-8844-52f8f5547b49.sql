ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS is_info boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS assets_is_info_idx ON public.assets (folder_id, is_info);
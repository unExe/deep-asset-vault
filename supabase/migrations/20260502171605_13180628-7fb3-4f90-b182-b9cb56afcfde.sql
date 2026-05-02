CREATE TABLE public.gdrive_embeds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  drive_folder_id text NOT NULL,
  parent_folder_id uuid NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gdrive_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read gdrive_embeds" ON public.gdrive_embeds FOR SELECT USING (true);
CREATE POLICY "anyone insert gdrive_embeds" ON public.gdrive_embeds FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update gdrive_embeds" ON public.gdrive_embeds FOR UPDATE USING (true);
CREATE POLICY "anyone delete gdrive_embeds" ON public.gdrive_embeds FOR DELETE USING (true);

CREATE INDEX idx_gdrive_embeds_parent ON public.gdrive_embeds(parent_folder_id);
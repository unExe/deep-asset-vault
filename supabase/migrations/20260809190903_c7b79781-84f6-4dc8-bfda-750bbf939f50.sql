CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read site_settings" ON public.site_settings FOR SELECT USING (true);

CREATE TABLE public.admin_credentials (
  id int PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  pet_answer_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_credentials_single_row CHECK (id = 1)
);
GRANT ALL ON public.admin_credentials TO service_role;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone log page_views" ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(path) between 1 and 300
    AND (referrer IS NULL OR length(referrer) <= 300)
    AND length(visitor_id) between 8 and 64
    AND created_at <= now() + interval '1 minute'
  );
CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"badge":"short-form · creator","title":"The Vault","titleAccent":".unExe","subtitle":"I make short-form content. Every asset I use — overlays, sounds, presets, project files — lives here. Preview anything, download what you need.","avatarUrl":""}'::jsonb),
  ('socials', '[{"id":"yt","label":"YouTube","handle":"/ @unexecutable","url":"https://youtube.com/@unexecutable?si=U0GY6Jh7rd_CcrC4","icon":"youtube"},{"id":"tg","label":"Telegram","handle":"/ join the channel","url":"https://t.me/+MMr5_awFb4BkN2E9","icon":"telegram"}]'::jsonb);
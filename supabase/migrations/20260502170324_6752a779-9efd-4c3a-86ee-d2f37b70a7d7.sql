CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read blogs" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "anyone insert blogs" ON public.blogs FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update blogs" ON public.blogs FOR UPDATE USING (true);
CREATE POLICY "anyone delete blogs" ON public.blogs FOR DELETE USING (true);

CREATE INDEX idx_blogs_created_at ON public.blogs (created_at DESC);
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN (tags);

CREATE TRIGGER touch_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.touch_blocks_updated_at();
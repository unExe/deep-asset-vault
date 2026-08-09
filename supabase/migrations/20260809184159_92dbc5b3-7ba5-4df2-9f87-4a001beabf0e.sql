-- 1. Remove permissive public write policies (reads stay public)
DROP POLICY IF EXISTS "Anyone can create assets" ON public.assets;
DROP POLICY IF EXISTS "Anyone can update assets" ON public.assets;
DROP POLICY IF EXISTS "Anyone can delete assets" ON public.assets;

DROP POLICY IF EXISTS "Anyone can create folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can update folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can delete folders" ON public.folders;

DROP POLICY IF EXISTS "anyone insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "anyone update blogs" ON public.blogs;
DROP POLICY IF EXISTS "anyone delete blogs" ON public.blogs;

DROP POLICY IF EXISTS "anyone insert gdrive_embeds" ON public.gdrive_embeds;
DROP POLICY IF EXISTS "anyone update gdrive_embeds" ON public.gdrive_embeds;
DROP POLICY IF EXISTS "anyone delete gdrive_embeds" ON public.gdrive_embeds;

DROP POLICY IF EXISTS "anyone insert homepage_blocks" ON public.homepage_blocks;
DROP POLICY IF EXISTS "anyone update homepage_blocks" ON public.homepage_blocks;
DROP POLICY IF EXISTS "anyone delete homepage_blocks" ON public.homepage_blocks;

DROP POLICY IF EXISTS "anyone delete comments" ON public.folder_comments;

-- 2. Revoke write privileges so only service_role can mutate these tables
REVOKE INSERT, UPDATE, DELETE ON public.assets FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.folders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.blogs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.gdrive_embeds FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.homepage_blocks FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.folder_comments FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.asset_events FROM anon, authenticated;

GRANT SELECT ON public.assets TO anon, authenticated;
GRANT SELECT ON public.folders TO anon, authenticated;
GRANT SELECT ON public.blogs TO anon, authenticated;
GRANT SELECT ON public.gdrive_embeds TO anon, authenticated;
GRANT SELECT ON public.homepage_blocks TO anon, authenticated;
GRANT SELECT, INSERT ON public.folder_comments TO anon, authenticated;
GRANT SELECT, INSERT ON public.asset_events TO anon, authenticated;

GRANT ALL ON public.assets TO service_role;
GRANT ALL ON public.folders TO service_role;
GRANT ALL ON public.blogs TO service_role;
GRANT ALL ON public.gdrive_embeds TO service_role;
GRANT ALL ON public.homepage_blocks TO service_role;
GRANT ALL ON public.folder_comments TO service_role;
GRANT ALL ON public.asset_events TO service_role;

-- 3. Validate analytics inserts instead of accepting anything
DROP POLICY IF EXISTS "anyone insert asset_events" ON public.asset_events;
CREATE POLICY "validated insert asset_events"
ON public.asset_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  kind IN ('view', 'download')
  AND length(visitor_id) BETWEEN 8 AND 64
  AND created_at <= now() + interval '1 minute'
  AND EXISTS (SELECT 1 FROM public.assets a WHERE a.id = asset_events.asset_id)
);

-- 4. Storage: keep public reads, remove public writes on the assets bucket
DROP POLICY IF EXISTS "Anyone can upload to assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from assets bucket" ON storage.objects;
REVOKE SELECT ON public.folder_comments FROM anon, authenticated;
GRANT SELECT (id, folder_id, parent_id, name, body, created_at) ON public.folder_comments TO anon, authenticated;

REVOKE SELECT ON public.asset_events FROM anon, authenticated;
GRANT SELECT (id, asset_id, kind, created_at) ON public.asset_events TO anon, authenticated;
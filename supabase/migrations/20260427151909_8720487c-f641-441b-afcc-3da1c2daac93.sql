
CREATE POLICY "Anyone can create folders" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update folders" ON public.folders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete folders" ON public.folders FOR DELETE USING (true);

CREATE POLICY "Anyone can create assets" ON public.assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update assets" ON public.assets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete assets" ON public.assets FOR DELETE USING (true);

CREATE POLICY "Anyone can upload to assets bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets');
CREATE POLICY "Anyone can delete from assets bucket" ON storage.objects FOR DELETE USING (bucket_id = 'assets');


-- Create storage bucket for novel covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('novel-covers', 'novel-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload covers
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'novel-covers');

-- Allow public read access
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'novel-covers');

-- Allow authenticated users to delete covers
CREATE POLICY "Authenticated users can delete covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'novel-covers');

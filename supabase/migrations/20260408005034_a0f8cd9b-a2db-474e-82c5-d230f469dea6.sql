-- Create public storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Allow admins to upload banner images
CREATE POLICY "Admins can upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update banner images
CREATE POLICY "Admins can update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete banner images
CREATE POLICY "Admins can delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read access to banner images
CREATE POLICY "Public can view banner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');
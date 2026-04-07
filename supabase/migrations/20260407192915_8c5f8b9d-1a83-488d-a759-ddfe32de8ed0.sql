
-- Fix the permissive INSERT policy on novel_views
-- Allow anyone to insert but restrict to prevent abuse
DROP POLICY "Anyone can insert views" ON public.novel_views;

-- Allow authenticated users to insert views
CREATE POLICY "Authenticated users can insert views" ON public.novel_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert views (for tracking without login)
CREATE POLICY "Anon users can insert views" ON public.novel_views
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

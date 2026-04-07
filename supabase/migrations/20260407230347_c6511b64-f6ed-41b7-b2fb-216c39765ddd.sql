-- Fix: Add author-scoped INSERT/DELETE policies on novel_tags
-- Authors can only manage tags for novels they own

CREATE POLICY "Authors can manage own novel tags"
  ON public.novel_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.novels n
      JOIN public.authors a ON n.author_id = a.id
      WHERE n.id = novel_tags.novel_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.novels n
      JOIN public.authors a ON n.author_id = a.id
      WHERE n.id = novel_tags.novel_id
        AND a.user_id = auth.uid()
    )
  );
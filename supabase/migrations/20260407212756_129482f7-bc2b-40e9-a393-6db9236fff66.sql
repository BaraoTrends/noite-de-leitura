-- Fix 1: novel_views INSERT policy - restrict user_id to current user or NULL
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.novel_views;
CREATE POLICY "Authenticated users can insert views"
  ON public.novel_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix 2: comments UPDATE policy - prevent users from tampering with moderation fields
-- Replace the permissive update policy with one that uses a trigger to protect moderation fields
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to prevent non-admin users from changing moderation fields
CREATE OR REPLACE FUNCTION public.protect_comment_moderation_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_approved := OLD.is_approved;
    NEW.is_flagged := OLD.is_flagged;
    NEW.likes := OLD.likes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_comment_moderation ON public.comments;
CREATE TRIGGER protect_comment_moderation
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_comment_moderation_fields();
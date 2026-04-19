ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS seo_extras JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
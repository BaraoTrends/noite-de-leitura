
-- Indexing status table
CREATE TABLE public.indexing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  novel_id UUID,
  chapter_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  last_submitted_at TIMESTAMP WITH TIME ZONE,
  last_indexed_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  google_response JSONB,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_indexing_status_novel ON public.indexing_status(novel_id);
CREATE INDEX idx_indexing_status_chapter ON public.indexing_status(chapter_id);
CREATE INDEX idx_indexing_status_status ON public.indexing_status(status);

ALTER TABLE public.indexing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage indexing status"
ON public.indexing_status FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Indexing status viewable by everyone"
ON public.indexing_status FOR SELECT
TO public
USING (true);

-- Indexing alerts table
CREATE TABLE public.indexing_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_indexing_alerts_resolved ON public.indexing_alerts(is_resolved);

ALTER TABLE public.indexing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage indexing alerts"
ON public.indexing_alerts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keyword rankings table
CREATE TABLE public.keyword_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  novel_id UUID,
  position INTEGER,
  previous_position INTEGER,
  search_engine TEXT NOT NULL DEFAULT 'google',
  country TEXT NOT NULL DEFAULT 'BR',
  device TEXT NOT NULL DEFAULT 'desktop',
  search_volume INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_keyword_rankings_keyword ON public.keyword_rankings(keyword);
CREATE INDEX idx_keyword_rankings_url ON public.keyword_rankings(url);
CREATE INDEX idx_keyword_rankings_novel ON public.keyword_rankings(novel_id);
CREATE INDEX idx_keyword_rankings_checked ON public.keyword_rankings(checked_at DESC);

ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage keyword rankings"
ON public.keyword_rankings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- SEO audit jobs table
CREATE TABLE public.seo_audit_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  novel_id UUID,
  chapter_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  issues JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  meta_analysis JSONB DEFAULT '{}'::jsonb,
  content_analysis JSONB DEFAULT '{}'::jsonb,
  technical_analysis JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_audit_jobs_novel ON public.seo_audit_jobs(novel_id);
CREATE INDEX idx_seo_audit_jobs_status ON public.seo_audit_jobs(status);
CREATE INDEX idx_seo_audit_jobs_created ON public.seo_audit_jobs(created_at DESC);

ALTER TABLE public.seo_audit_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo audit jobs"
ON public.seo_audit_jobs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Internal links table
CREATE TABLE public.internal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_novel_id UUID,
  source_chapter_id UUID,
  source_url TEXT NOT NULL,
  target_novel_id UUID,
  target_chapter_id UUID,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'suggested',
  relevance_score NUMERIC,
  created_by UUID,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_links_source_novel ON public.internal_links(source_novel_id);
CREATE INDEX idx_internal_links_target_novel ON public.internal_links(target_novel_id);
CREATE INDEX idx_internal_links_status ON public.internal_links(status);

ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage internal links"
ON public.internal_links FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Internal links viewable by everyone"
ON public.internal_links FOR SELECT
TO public
USING (true);

-- Generic updated_at trigger function (reused)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_indexing_status_updated_at
BEFORE UPDATE ON public.indexing_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_links_updated_at
BEFORE UPDATE ON public.internal_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

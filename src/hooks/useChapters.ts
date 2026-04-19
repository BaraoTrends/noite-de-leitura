import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChapterData {
  id: string;
  title: string;
  content: string;
  chapter_order: number;
  published_at: string | null;
  views: number;
  novel_id: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_extras?: {
    h1_suggestion?: string;
    image_alt?: string;
    schema_article?: any;
    updated_at?: string;
  } | null;
}

export function useChaptersByNovel(novelId: string | undefined) {
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!novelId) { setChapters([]); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chapters')
        .select('id, title, content, chapter_order, published_at, views, novel_id, meta_title, meta_description, meta_keywords, seo_extras')
        .eq('novel_id', novelId)
        .eq('status', 'published')
        .order('chapter_order', { ascending: true });
      setChapters(data || []);
      setLoading(false);
    };
    fetch();
  }, [novelId]);

  return { chapters, loading };
}

export function useChapterById(chapterId: string | undefined) {
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) { setChapter(null); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chapters')
        .select('id, title, content, chapter_order, published_at, views, novel_id, meta_title, meta_description, meta_keywords, seo_extras')
        .eq('id', chapterId)
        .single();
      setChapter(data || null);
      setLoading(false);
    };
    fetch();
  }, [chapterId]);

  return { chapter, loading };
}

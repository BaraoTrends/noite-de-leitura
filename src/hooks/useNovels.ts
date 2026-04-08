import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Novel, Author } from '@/types/novel';

function mapDbNovelToNovel(dbNovel: any): Novel {
  const author: Author = {
    id: dbNovel.authors?.id || dbNovel.author_id,
    name: dbNovel.authors?.name || 'Unknown',
    avatar: dbNovel.authors?.avatar_url || '',
    bio: dbNovel.authors?.bio || '',
    socialLinks: {
      twitter: dbNovel.authors?.twitter || undefined,
      instagram: dbNovel.authors?.instagram || undefined,
      website: dbNovel.authors?.website || undefined,
    },
  };

  const categories = dbNovel.novel_categories?.map((nc: any) => nc.categories?.name).filter(Boolean) || [];

  return {
    id: dbNovel.id,
    title: dbNovel.title,
    synopsis: dbNovel.synopsis || '',
    content: dbNovel.content || '',
    author,
    categories,
    tags: [],
    rating: Number(dbNovel.rating) || 0,
    ratingCount: dbNovel.rating_count || 0,
    views: dbNovel.views || 0,
    readTime: dbNovel.read_time || 0,
    publishDate: dbNovel.published_at || dbNovel.created_at,
    thumbnail: dbNovel.thumbnail_url || '/placeholder.svg',
    ageRating: dbNovel.age_rating as Novel['ageRating'] || 'Livre',
    isFeatured: dbNovel.is_featured || false,
    isNew: dbNovel.is_new || false,
    youtubeVideoId: dbNovel.youtube_video_id || undefined,
    commentsCount: 0,
  };
}

export function useNovels() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('novels')
        .select('*, authors(*), novel_categories(category_id, categories(name))')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNovels(data.map(mapDbNovelToNovel));
      }
      setLoading(false);
    };

    fetchNovels();
  }, []);

  const featuredNovels = novels.filter(n => n.isFeatured);
  const topNovels = [...novels].sort((a, b) => b.views - a.views).slice(0, 10);
  const newNovels = novels.filter(n => n.isNew);

  return { novels, featuredNovels, topNovels, newNovels, loading };
}

export function useNovelById(id: string | undefined) {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchNovel = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('novels')
        .select('*, authors(*), novel_categories(category_id, categories(name))')
        .eq('id', id)
        .single();

      if (!error && data) {
        setNovel(mapDbNovelToNovel(data));
      }
      setLoading(false);
    };
    fetchNovel();
  }, [id]);

  return { novel, loading };
}

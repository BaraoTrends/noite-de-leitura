import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Novel, Author } from '@/types/novel';

type NovelSort = 'newest' | 'popular' | 'rating';

interface UseNovelsOptions {
  page?: number;
  pageSize?: number;
  sort?: NovelSort;
  onlyNew?: boolean;
  onlyWithVideo?: boolean;
  authorId?: string;
}

function mapDbAuthorToAuthor(dbAuthor: any): Author {
  return {
    id: dbAuthor?.id || dbAuthor?.user_id || '',
    name: dbAuthor?.name || 'Unknown',
    avatar: dbAuthor?.avatar_url || '/placeholder.svg',
    bio: dbAuthor?.bio || '',
    socialLinks: {
      twitter: dbAuthor?.twitter || undefined,
      instagram: dbAuthor?.instagram || undefined,
      website: dbAuthor?.website || undefined,
    },
  };
}

function mapDbNovelToNovel(dbNovel: any): Novel {
  const author = mapDbAuthorToAuthor(dbNovel.authors || { id: dbNovel.author_id });
  const categories = dbNovel.novel_categories?.map((nc: any) => nc.categories?.name).filter(Boolean) || [];
  const tags = dbNovel.novel_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [];

  return {
    id: dbNovel.id,
    title: dbNovel.title,
    synopsis: dbNovel.synopsis || '',
    content: dbNovel.content || '',
    author,
    categories,
    tags,
    rating: Number(dbNovel.rating) || 0,
    ratingCount: dbNovel.rating_count || 0,
    views: dbNovel.views || 0,
    readTime: dbNovel.read_time || 0,
    publishDate: dbNovel.published_at || dbNovel.created_at,
    thumbnail: dbNovel.thumbnail_url || '/placeholder.svg',
    ageRating: (dbNovel.age_rating as Novel['ageRating']) || 'Livre',
    isFeatured: dbNovel.is_featured || false,
    isNew: dbNovel.is_new || false,
    youtubeVideoId: dbNovel.youtube_video_id || undefined,
    commentsCount: 0,
    seoExtras: dbNovel.seo_extras || undefined,
  };
}

export function useNovels(options: UseNovelsOptions = {}) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const {
    page = 1,
    pageSize,
    sort = 'newest',
    onlyNew = false,
    onlyWithVideo = false,
    authorId,
  } = options;

  useEffect(() => {
    const fetchNovels = async () => {
      setLoading(true);

      let query = supabase
        .from('novels')
        .select('*, authors(*), novel_categories(category_id, categories(name)), novel_tags(tag_id, tags(name))', { count: 'exact' })
        .eq('status', 'published');

      if (onlyNew) {
        query = query.eq('is_new', true);
      }

      if (onlyWithVideo) {
        query = query.not('youtube_video_id', 'is', null);
      }

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      if (sort === 'popular') {
        query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
      } else if (sort === 'rating') {
        query = query.order('rating', { ascending: false }).order('rating_count', { ascending: false });
      } else {
        query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      }

      if (pageSize) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (!error && data) {
        setNovels(data.map(mapDbNovelToNovel));
        setTotalCount(count ?? data.length);
      } else {
        setNovels([]);
        setTotalCount(0);
      }

      setLoading(false);
    };

    fetchNovels();
  }, [authorId, onlyNew, onlyWithVideo, page, pageSize, sort]);

  const featuredNovels = novels.filter((n) => n.isFeatured);
  const topNovels = [...novels].sort((a, b) => b.views - a.views).slice(0, 10);
  const newNovels = novels.filter((n) => n.isNew);
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  return {
    novels,
    featuredNovels,
    topNovels,
    newNovels,
    loading,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export function useNovelById(id: string | undefined) {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setNovel(null);
      setLoading(false);
      return;
    }

    const fetchNovel = async () => {
      setLoading(true);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const filter = isUuid
        ? `id.eq.${id},slug.eq.${id}`
        : `slug.eq.${id}`;
      const { data, error } = await supabase
        .from('novels')
        .select('*, authors(*), novel_categories(category_id, categories(name)), novel_tags(tag_id, tags(name))')
        .or(filter)
        .single();

      if (!error && data) {
        setNovel(mapDbNovelToNovel(data));
      } else {
        setNovel(null);
      }

      setLoading(false);
    };

    fetchNovel();
  }, [id]);

  return { novel, loading };
}

export function useAuthorById(id: string | undefined) {
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setAuthor(null);
      setLoading(false);
      return;
    }

    const fetchAuthor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setAuthor(mapDbAuthorToAuthor(data));
      } else {
        setAuthor(null);
      }

      setLoading(false);
    };

    fetchAuthor();
  }, [id]);

  return { author, loading };
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateNovelParams {
  genre?: string;
  theme?: string;
  tone?: string;
  language?: string;
}

interface GenerateChaptersParams {
  novelTitle: string;
  novelSynopsis: string;
  chapterCount?: number;
  language?: string;
}

interface GenerateSingleChapterParams {
  novelTitle: string;
  novelSynopsis: string;
  chapterNumber?: number;
  language?: string;
}

export function useAIGeneration() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAI = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (err: any) {
      toast({ title: 'Erro na geração', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateNovel = (params: GenerateNovelParams) =>
    callAI({ type: 'novel', ...params });

  const generateChapters = (params: GenerateChaptersParams) =>
    callAI({ type: 'chapters', ...params });

  const generateSingleChapter = (params: GenerateSingleChapterParams) =>
    callAI({ type: 'single_chapter', ...params });

  return { generateNovel, generateChapters, generateSingleChapter, loading };
}

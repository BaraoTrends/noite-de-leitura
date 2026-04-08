import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateNovelParams {
  genre?: string;
  theme?: string;
  tone?: string;
  language?: string;
  model?: string;
}

interface GenerateChaptersParams {
  novelTitle: string;
  novelSynopsis: string;
  chapterCount?: number;
  language?: string;
  model?: string;
}

interface GenerateSingleChapterParams {
  novelTitle: string;
  novelSynopsis: string;
  chapterNumber?: number;
  language?: string;
  model?: string;
}

async function saveGeneration(type: string, model: string, params: Record<string, unknown>, result: any, status: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: type,
      model: model || 'google/gemini-3-flash-preview',
      prompt_params: params as any,
      result_data: result as any,
      status,
    });
  } catch {
    // silently fail - don't block the user
  }
}

export function useAIGeneration() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callAI = async (body: Record<string, unknown>) => {
    setLoading(true);
    const type = body.type as string;
    const model = (body.model as string) || 'google/gemini-3-flash-preview';
    try {
      const { data, error } = await supabase.functions.invoke('generate-novel', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await saveGeneration(type, model, body, data, 'success');
      return data;
    } catch (err: any) {
      await saveGeneration(type, model, body, { error: err.message }, 'error');
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

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useReadingProgress(
  userId: string | undefined,
  novelId: string | undefined,
  chapterId: string | undefined
) {
  const lastSaved = useRef<number>(0);

  const saveProgress = useCallback(async () => {
    if (!userId || !novelId || !chapterId) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

    // Throttle: don't save more than once every 5s
    const now = Date.now();
    if (now - lastSaved.current < 5000) return;
    lastSaved.current = now;

    await supabase
      .from('reading_history')
      .upsert(
        {
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          progress,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,novel_id' }
      );
  }, [userId, novelId, chapterId]);

  useEffect(() => {
    if (!userId || !novelId || !chapterId) return;

    // Save immediately on chapter open
    const timeout = setTimeout(() => {
      supabase
        .from('reading_history')
        .upsert(
          {
            user_id: userId,
            novel_id: novelId,
            chapter_id: chapterId,
            progress: 0,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,novel_id' }
        );
    }, 1000);

    const handleScroll = () => saveProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Save on unmount
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
      saveProgress();
    };
  }, [userId, novelId, chapterId, saveProgress]);
}

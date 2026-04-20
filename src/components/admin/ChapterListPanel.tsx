import { useEffect, useMemo, useState } from 'react';
import { Clock3, ListOrdered } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface ChapterListPanelProps {
  novelId?: string;
  recentChapterIds?: string[];
  refreshKey?: number;
}

interface ChapterListItem {
  id: string;
  title: string;
  chapter_order: number;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

const statusClasses: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground border-border',
  published: 'bg-primary/10 text-primary border-primary/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export function ChapterListPanel({ novelId, recentChapterIds = [], refreshKey = 0 }: ChapterListPanelProps) {
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentIds = useMemo(() => new Set(recentChapterIds), [recentChapterIds]);

  useEffect(() => {
    if (!novelId) {
      setChapters([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchChapters = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('id, title, chapter_order, status, created_at')
        .eq('novel_id', novelId)
        .order('chapter_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setChapters([]);
      } else {
        setChapters((data || []) as ChapterListItem[]);
      }

      setLoading(false);
    };

    fetchChapters();

    return () => {
      cancelled = true;
    };
  }, [novelId, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          Capítulos deste romance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!novelId ? (
          <p className="text-sm text-muted-foreground">Salve o romance primeiro para começar a gerar e acompanhar os capítulos.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Carregando capítulos...</p>
        ) : error ? (
          <p className="text-sm text-destructive">Erro ao carregar capítulos: {error}</p>
        ) : chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum capítulo cadastrado ainda.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Total: {chapters.length} capítulo(s)</span>
              {recentChapterIds.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {recentChapterIds.length} novo(s) nesta geração
                </Badge>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cap.</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter) => {
                  const isRecent = recentIds.has(chapter.id);

                  return (
                    <TableRow key={chapter.id} className={isRecent ? 'bg-primary/5' : undefined}>
                      <TableCell className="font-medium">{chapter.chapter_order}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{chapter.title}</span>
                          {isRecent && <Badge className="bg-primary text-primary-foreground">Novo agora</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClasses[chapter.status] || statusClasses.draft}>
                          {statusLabels[chapter.status] || chapter.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock3 className="w-3.5 h-3.5" />
                          {new Date(chapter.created_at).toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
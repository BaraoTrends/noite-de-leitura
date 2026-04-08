import { useEffect, useState } from 'react';
import { Sparkles, Eye, Loader2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';

interface AIGeneration {
  id: string;
  user_id: string;
  generation_type: string;
  model: string;
  prompt_params: Record<string, any>;
  result_data: Record<string, any>;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  novel: 'Novel',
  chapters: 'Capítulos',
  single_chapter: 'Capítulo único',
};

export default function AdminAIHistory() {
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AIGeneration | null>(null);
  const { generateNovel, generateChapters, generateSingleChapter, loading: generating } = useAIGeneration();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = () => {
    setLoading(true);
    supabase
      .from('ai_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setGenerations((data as any[]) || []);
        setLoading(false);
      });
  };

  const handleReuse = async (gen: AIGeneration) => {
    const params = gen.prompt_params;
    let result: any = null;

    if (gen.generation_type === 'novel') {
      result = await generateNovel({
        genre: params.genre,
        theme: params.theme,
        tone: params.tone,
        language: params.language,
        model: params.model || gen.model,
      });
    } else if (gen.generation_type === 'chapters') {
      result = await generateChapters({
        novelTitle: params.novelTitle,
        novelSynopsis: params.novelSynopsis,
        chapterCount: params.chapterCount,
        language: params.language,
        model: params.model || gen.model,
      });
    } else if (gen.generation_type === 'single_chapter') {
      result = await generateSingleChapter({
        novelTitle: params.novelTitle,
        novelSynopsis: params.novelSynopsis,
        chapterNumber: params.chapterNumber,
        language: params.language,
        model: params.model || gen.model,
      });
    }

    if (result && !result.error && !result.raw) {
      toast({ title: 'Geração concluída!', description: 'Uma nova geração foi criada com os mesmos parâmetros.' });
      loadGenerations();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl text-foreground">Histórico de Gerações IA</h1>
          <Badge variant="secondary">{generations.length}</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : generations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma geração registrada ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <Card key={gen.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={gen.status === 'success' ? 'default' : 'destructive'}>
                        {gen.status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                      <Badge variant="outline">{typeLabels[gen.generation_type] || gen.generation_type}</Badge>
                      <span className="text-xs text-muted-foreground">{gen.model}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {gen.generation_type === 'novel' && gen.result_data?.title
                        ? `"${gen.result_data.title}" — ${gen.prompt_params?.genre || 'Sem gênero'}`
                        : gen.prompt_params?.novelTitle
                          ? `Para: "${gen.prompt_params.novelTitle}"`
                          : 'Geração via IA'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(gen.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Reutilizar parâmetros"
                      disabled={generating}
                      onClick={() => handleReuse(gen)}
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => setSelected(gen)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Detalhes da Geração
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Tipo:</span> {typeLabels[selected.generation_type] || selected.generation_type}</div>
                <div><span className="text-muted-foreground">Modelo:</span> {selected.model}</div>
                <div><span className="text-muted-foreground">Status:</span> {selected.status}</div>
                <div><span className="text-muted-foreground">Data:</span> {new Date(selected.created_at).toLocaleString('pt-BR')}</div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm">Parâmetros</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selected.prompt_params, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm">Resultado</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-60">
                  {JSON.stringify(selected.result_data, null, 2)}
                </pre>
              </div>
              <Button
                className="w-full gap-2"
                disabled={generating}
                onClick={() => { handleReuse(selected); setSelected(null); }}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reutilizar estes parâmetros
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

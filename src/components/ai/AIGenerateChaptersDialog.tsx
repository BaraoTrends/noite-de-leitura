import { useState } from 'react';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';
import { AIModelSelect } from './AIModelSelect';

interface Props {
  novelTitle: string;
  novelSynopsis: string;
  novelId: string;
  onGenerated?: (chapters: Array<{ title: string; chapter_order: number; content: string }>) => void;
}

export function AIGenerateChaptersDialog({ novelTitle, novelSynopsis, novelId, onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [chapterCount, setChapterCount] = useState(5);
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const { generateChapters, loading } = useAIGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const result = await generateChapters({
      novelTitle,
      novelSynopsis,
      chapterCount,
      language: 'Portuguese (Brazil)',
      model,
    });
    if (result?.chapters) {
      onGenerated?.(result.chapters);
      toast({ title: 'Capítulos gerados!', description: `${result.chapters.length} capítulos foram criados.` });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Gerar Capítulos com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Gerar Capítulos para "{novelTitle}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AIModelSelect value={model} onChange={setModel} />
          <div className="space-y-2">
            <Label>Quantidade de capítulos</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={chapterCount}
              onChange={e => setChapterCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            A IA vai gerar {chapterCount} capítulo{chapterCount > 1 ? 's' : ''} baseado{chapterCount > 1 ? 's' : ''} na sinopse da novel.
          </p>
          <Button onClick={handleGenerate} disabled={loading || !novelTitle} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Gerando capítulos...' : 'Gerar Capítulos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

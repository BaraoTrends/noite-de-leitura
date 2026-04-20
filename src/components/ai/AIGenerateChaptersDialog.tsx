import { useState } from 'react';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';
import { AIModelSelect } from './AIModelSelect';

interface Props {
  novelTitle: string;
  novelSynopsis: string;
  novelId: string;
  onGenerated?: (chapters: Array<{ title: string; chapter_order: number; content: string }>) => void;
}

export function AIGenerateChaptersDialog({ novelTitle, novelSynopsis, onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'count' | 'range' | 'list'>('count');
  const [chapterCount, setChapterCount] = useState(5);
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(5);
  const [chapterList, setChapterList] = useState('1, 2, 3');
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const { generateChapters, loading } = useAIGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const params: any = {
      novelTitle,
      novelSynopsis,
      language: 'Portuguese (Brazil)',
      model,
    };
    if (mode === 'count') params.chapterCount = chapterCount;
    else if (mode === 'range') {
      if (endChapter < startChapter) {
        toast({ title: 'Intervalo inválido', description: 'Capítulo final deve ser ≥ inicial', variant: 'destructive' });
        return;
      }
      if (endChapter - startChapter + 1 > 10) {
        toast({ title: 'Máximo 10 capítulos por geração', variant: 'destructive' });
        return;
      }
      params.startChapter = startChapter;
      params.endChapter = endChapter;
    } else {
      const nums = chapterList.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (nums.length === 0) {
        toast({ title: 'Lista inválida', description: 'Use números separados por vírgula', variant: 'destructive' });
        return;
      }
      if (nums.length > 10) {
        toast({ title: 'Máximo 10 capítulos por geração', variant: 'destructive' });
        return;
      }
      params.chapterNumbers = nums;
    }

    const result = await generateChapters(params);
    if (result?.chapters) {
      onGenerated?.(result.chapters);
      toast({ title: 'Capítulos gerados!', description: `${result.chapters.length} capítulo(s) criado(s).` });
      setOpen(false);
    }
  };

  const totalToGenerate =
    mode === 'count' ? chapterCount :
    mode === 'range' ? Math.max(0, endChapter - startChapter + 1) :
    chapterList.split(',').map(s => s.trim()).filter(Boolean).length;

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

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="count">Quantidade</TabsTrigger>
              <TabsTrigger value="range">Intervalo</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>

            <TabsContent value="count" className="space-y-2 mt-3">
              <Label>Quantidade de capítulos (1–10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={chapterCount}
                onChange={e => setChapterCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Gera capítulos 1 até {chapterCount}.</p>
            </TabsContent>

            <TabsContent value="range" className="space-y-2 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>De</Label>
                  <Input type="number" min={1} value={startChapter}
                    onChange={e => setStartChapter(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
                <div>
                  <Label>Até</Label>
                  <Input type="number" min={1} value={endChapter}
                    onChange={e => setEndChapter(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Máx. 10 capítulos por geração.</p>
            </TabsContent>

            <TabsContent value="list" className="space-y-2 mt-3">
              <Label>Capítulos específicos (vírgulas)</Label>
              <Input value={chapterList} onChange={e => setChapterList(e.target.value)} placeholder="1, 3, 5, 7" />
              <p className="text-xs text-muted-foreground">Ex.: 2, 4, 7 — máx. 10 capítulos.</p>
            </TabsContent>
          </Tabs>

          <p className="text-sm text-muted-foreground">
            Total a gerar: <strong>{totalToGenerate}</strong> capítulo(s).
          </p>

          <Button onClick={handleGenerate} disabled={loading || !novelTitle || totalToGenerate === 0} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Gerando capítulos...' : 'Gerar Capítulos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

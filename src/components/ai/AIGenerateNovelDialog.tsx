import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';
import { AIModelSelect } from './AIModelSelect';

const GENRES = ['Romance', 'Fantasia', 'Terror', 'Ficção Científica', 'Mistério', 'Aventura', 'Drama', 'Comédia'];
const TONES = ['Dramático', 'Romântico', 'Sombrio', 'Leve', 'Suspense', 'Épico', 'Adulto (+18)'];

interface Props {
  onGenerated?: (data: { title: string; synopsis: string; content: string; tags?: string[]; age_rating?: string; read_time?: number }) => void;
  triggerVariant?: 'button' | 'icon';
}

export function AIGenerateNovelDialog({ onGenerated, triggerVariant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState('');
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('Dramático');
  const [model, setModel] = useState('google/gemini-3-flash-preview');
  const { generateNovel, loading } = useAIGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const result = await generateNovel({ genre, theme, tone, language: 'Portuguese (Brazil)', model });
    if (result && !result.raw) {
      onGenerated?.(result);
      toast({ title: 'Novel gerada!', description: `"${result.title}" foi criada com IA.` });
      setOpen(false);
    } else if (result?.raw) {
      toast({ title: 'Erro', description: 'Não foi possível processar a resposta da IA.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button variant="ghost" size="icon" title="Gerar com IA">
            <Sparkles className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar Novel com IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Novel com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AIModelSelect value={model} onChange={setModel} />
          <div className="space-y-2">
            <Label>Gênero</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger><SelectValue placeholder="Escolha um gênero" /></SelectTrigger>
              <SelectContent>
                {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tema (opcional)</Label>
            <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ex: redenção, amor proibido..." />
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Gerando...' : 'Gerar Novel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

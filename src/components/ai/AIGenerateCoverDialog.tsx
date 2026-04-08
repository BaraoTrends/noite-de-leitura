import { useState } from 'react';
import { ImagePlus, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const IMAGE_MODELS = [
  { value: 'google/gemini-2.5-flash-image', label: 'Rápido', description: 'Geração rápida e econômica' },
  { value: 'google/gemini-3.1-flash-image-preview', label: 'Alta Qualidade', description: 'Qualidade profissional, mais lento' },
  { value: 'google/gemini-3-pro-image-preview', label: 'Premium', description: 'Melhor qualidade possível' },
];

const STYLE_PRESETS = [
  { value: 'fantasy', label: 'Fantasia', prompt: 'epic fantasy art style, magical atmosphere, vibrant colors' },
  { value: 'romance', label: 'Romance', prompt: 'romantic, soft lighting, warm tones, elegant composition' },
  { value: 'horror', label: 'Terror', prompt: 'dark, moody, atmospheric horror, dramatic shadows' },
  { value: 'scifi', label: 'Ficção Científica', prompt: 'futuristic, sci-fi, neon lights, cyberpunk aesthetic' },
  { value: 'literary', label: 'Literário', prompt: 'minimalist, artistic, abstract, sophisticated composition' },
  { value: 'erotic', label: 'Sensual', prompt: 'sensual, intimate atmosphere, warm golden lighting, artistic and tasteful' },
  { value: 'thriller', label: 'Suspense', prompt: 'noir style, suspenseful, dramatic contrast, mysterious atmosphere' },
  { value: 'custom', label: 'Personalizado', prompt: '' },
];

interface Props {
  novelTitle?: string;
  onGenerated: (imageUrl: string) => void;
}

export function AIGenerateCoverDialog({ novelTitle, onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-flash-image');
  const [style, setStyle] = useState('fantasy');
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const buildPrompt = () => {
    const preset = STYLE_PRESETS.find(s => s.value === style);
    const styleDesc = style === 'custom' ? customPrompt : preset?.prompt || '';
    const titlePart = novelTitle ? `for a novel titled "${novelTitle}"` : '';
    return `Create a stunning book cover illustration ${titlePart}. Style: ${styleDesc}. The image should be visually striking and suitable as a novel cover. No text or letters in the image. High quality, detailed artwork, vertical portrait orientation.`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setPreviewUrl(null);
    setGeneratedUrl(null);

    try {
      const prompt = style === 'custom' && customPrompt ? customPrompt : buildPrompt();
      const { data, error } = await supabase.functions.invoke('generate-cover', {
        body: { prompt, novelTitle, model },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPreviewUrl(data.base64 || data.image_url);
      setGeneratedUrl(data.image_url);

      toast({ title: 'Capa gerada com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro na geração', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (generatedUrl) {
      onGenerated(generatedUrl);
      setOpen(false);
      setPreviewUrl(null);
      setGeneratedUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImagePlus className="w-4 h-4 mr-2" />
          Gerar Capa com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Capa com IA
          </DialogTitle>
          <DialogDescription>
            Gere uma imagem de capa para sua novel usando inteligência artificial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Estilo Visual</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {style === 'custom' && (
            <div className="space-y-2">
              <Label>Prompt Personalizado</Label>
              <Textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Descreva a imagem de capa que você deseja..."
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Qualidade</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex flex-col">
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-[2/3] max-h-64 mx-auto">
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gerando imagem...</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {previewUrl && (
            <Button variant="outline" onClick={handleGenerate} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Gerar Outra
            </Button>
          )}
          {!previewUrl ? (
            <Button onClick={handleGenerate} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Capa'}
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={loading}>
              Usar Esta Capa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

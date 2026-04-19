import { useState } from 'react';
import { Loader2, Wand2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SerpPreview } from './SerpPreview';
import { OgPreview } from './OgPreview';

interface Props {
  chapterId: string;
  novelSlug?: string;
  novelId?: string;
  initialMetaTitle?: string;
  initialMetaDescription?: string;
  thumbnailUrl?: string;
  size?: 'sm' | 'default';
}

export function SeoAutoFixChapterButton({
  chapterId,
  novelSlug,
  novelId,
  initialMetaTitle,
  initialMetaDescription,
  size = 'sm',
}: Props) {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const autoFix = async () => {
    setFixing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('seo-auto-fix-chapter', {
        body: { chapter_id: chapterId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast({
        title: 'SEO do capítulo corrigido!',
        description: 'Meta tags, H1, alt e schema Article atualizados.',
      });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setFixing(false);
    }
  };

  // SERP preview uses freshly applied values when present, otherwise the initial chapter values
  const previewTitle = (result?.applied?.meta_title || initialMetaTitle || '').trim();
  const previewDesc = (result?.applied?.meta_description || initialMetaDescription || '').trim();
  const novelPart = novelSlug || novelId || 'novel';
  const previewUrl = `https://eroticsnovels.com/novel/${novelPart}/capitulo/${chapterId}`;

  return (
    <div className="space-y-2">
      {(previewTitle || previewDesc) && (
        <SerpPreview
          title={previewTitle}
          description={previewDesc}
          url={previewUrl}
          label="Pré-visualização SERP do capítulo"
        />
      )}

      <Button onClick={autoFix} disabled={fixing} size={size} variant="outline" className="w-full">
        {fixing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Corrigindo SEO com IA...</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" />Corrigir SEO do capítulo com IA</>
        )}
      </Button>

      {result && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-3 space-y-2 text-xs">
            <p className="font-medium flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />Correções aplicadas
            </p>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Title:</span> {result.applied?.meta_title}</div>
              <div><span className="text-muted-foreground">Description:</span> {result.applied?.meta_description}</div>
              <div><span className="text-muted-foreground">H1:</span> {result.recommendations?.h1_suggestion}</div>
            </div>
            {result.improvements?.length > 0 && (
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5 mt-2">
                {result.improvements.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

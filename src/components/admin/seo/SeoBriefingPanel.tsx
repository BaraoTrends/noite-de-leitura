import { useState } from 'react';
import { Sparkles, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  title: string;
  synopsis: string;
  categories: string;
  ageRating: string;
}

interface Briefing {
  primary_keyword: string;
  secondary_keywords: string[];
  long_tail_keywords: string[];
  search_intent: string;
  recommended_title_pattern: string;
  recommended_description_pattern: string;
  content_outline: string[];
  internal_link_topics: string[];
  competitor_angle: string;
}

export function SeoBriefingPanel({ title, synopsis, categories, ageRating }: Props) {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!title) { toast({ title: 'Erro', description: 'Preencha o título primeiro.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-keyword-suggest', {
        body: { title, synopsis, categories, age_rating: ageRating },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBriefing(data);
    } catch (err: any) {
      toast({ title: 'Erro ao gerar briefing', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast({ title: 'Copiado!' }); };

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando briefing...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar Briefing SEO com IA</>}
      </Button>

      {briefing && (
        <div className="space-y-3 text-sm">
          <Card><CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Palavra-chave Principal</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(briefing.primary_keyword)}><Copy className="w-3 h-3" /></Button>
            </div>
            <p className="font-medium text-primary">{briefing.primary_keyword}</p>
          </CardContent></Card>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Secundárias</p>
            <div className="flex flex-wrap gap-1.5">
              {briefing.secondary_keywords?.map((k, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => copy(k)}>{k}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Long-tail</p>
            <div className="space-y-1">
              {briefing.long_tail_keywords?.map((k, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                  <span className="text-xs">{k}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copy(k)}><Copy className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Padrão Title sugerido</p>
              <p className="text-xs italic">{briefing.recommended_title_pattern}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Padrão Description sugerido</p>
              <p className="text-xs italic">{briefing.recommended_description_pattern}</p>
            </div>
          </div>

          {briefing.content_outline?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Outline de Conteúdo</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside text-muted-foreground">
                {briefing.content_outline.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {briefing.competitor_angle && (
            <div className="bg-primary/5 border border-primary/20 rounded p-2">
              <p className="text-xs uppercase tracking-wide text-primary mb-1">Ângulo Competitivo</p>
              <p className="text-xs">{briefing.competitor_angle}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

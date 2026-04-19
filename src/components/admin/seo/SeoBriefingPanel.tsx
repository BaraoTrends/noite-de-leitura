import { useState } from 'react';
import { Sparkles, Loader2, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  title: string;
  synopsis: string;
  categories: string;
  ageRating: string;
  onApply?: (field: string, value: string) => void;
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
  const [refining, setRefining] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!title) { toast({ title: 'Erro', description: 'Preencha o título primeiro.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-keyword-suggest', {
        body: { title, synopsis, categories, age_rating: ageRating, notes: manualNotes },
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

  const handleRefine = async () => {
    if (!briefing) return;
    setRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-keyword-suggest', {
        body: {
          title,
          synopsis,
          categories,
          age_rating: ageRating,
          notes: manualNotes,
          previous_briefing: briefing,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBriefing(data);
      toast({ title: 'Briefing refinado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setRefining(false);
    }
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast({ title: 'Copiado!' }); };

  const updateField = <K extends keyof Briefing>(field: K, value: Briefing[K]) => {
    setBriefing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Anotações / direcionamento manual (opcional)</Label>
        <Textarea
          value={manualNotes}
          onChange={e => setManualNotes(e.target.value)}
          placeholder="Ex: foco em público feminino, evitar palavras X, destacar enredo Y..."
          rows={2}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar com IA</>}
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefine} disabled={refining || !briefing}>
          {refining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Refinando...</> : <><Wand2 className="w-4 h-4 mr-2" />Refinar</>}
        </Button>
      </div>

      {briefing && (
        <div className="space-y-3 text-sm">
          <Card><CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Palavra-chave Principal</Label>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(briefing.primary_keyword)}><Copy className="w-3 h-3" /></Button>
            </div>
            <input
              value={briefing.primary_keyword}
              onChange={e => updateField('primary_keyword', e.target.value)}
              className="w-full bg-transparent border-b border-border/50 font-medium text-primary focus:outline-none focus:border-primary py-0.5"
            />
          </CardContent></Card>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Secundárias (separadas por vírgula)</Label>
            <Textarea
              value={(briefing.secondary_keywords || []).join(', ')}
              onChange={e => updateField('secondary_keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              rows={2}
              className="text-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              {briefing.secondary_keywords?.map((k, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer text-xs" onClick={() => copy(k)}>{k}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Long-tail (uma por linha)</Label>
            <Textarea
              value={(briefing.long_tail_keywords || []).join('\n')}
              onChange={e => updateField('long_tail_keywords', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Padrão Title sugerido</Label>
              <input
                value={briefing.recommended_title_pattern || ''}
                onChange={e => updateField('recommended_title_pattern', e.target.value)}
                className="w-full bg-transparent border-b border-border/50 text-xs italic focus:outline-none focus:border-primary py-0.5"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Padrão Description sugerido</Label>
              <Textarea
                value={briefing.recommended_description_pattern || ''}
                onChange={e => updateField('recommended_description_pattern', e.target.value)}
                rows={2}
                className="text-xs italic"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Outline de Conteúdo (uma por linha)</Label>
            <Textarea
              value={(briefing.content_outline || []).join('\n')}
              onChange={e => updateField('content_outline', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5 bg-primary/5 border border-primary/20 rounded p-2">
            <Label className="text-xs uppercase tracking-wide text-primary">Ângulo Competitivo</Label>
            <Textarea
              value={briefing.competitor_angle || ''}
              onChange={e => updateField('competitor_angle', e.target.value)}
              rows={2}
              className="text-xs bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

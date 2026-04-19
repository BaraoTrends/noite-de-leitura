import { useEffect, useState } from 'react';
import { Link2, Loader2, Check, X, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  target_id: string;
  target_url: string;
  anchor_text: string;
  context: string;
  relevance_score: number;
  reason: string;
}

interface ExistingLink {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string;
  status: string;
}

export function InternalLinksSuggestions({ novelId }: { novelId: string }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [existing, setExisting] = useState<ExistingLink[]>([]);
  const [sourceSlug, setSourceSlug] = useState('');
  const [manual, setManual] = useState({ anchor_text: '', target_url: '', context: '' });
  const [savingManual, setSavingManual] = useState(false);
  const { toast } = useToast();

  const loadExisting = async () => {
    const { data: source } = await supabase.from('novels').select('slug').eq('id', novelId).single();
    if (source?.slug) setSourceSlug(source.slug);
    const { data } = await supabase
      .from('internal_links')
      .select('id, source_url, target_url, anchor_text, status')
      .eq('source_novel_id', novelId)
      .order('created_at', { ascending: false });
    setExisting(data || []);
  };

  useEffect(() => { loadExisting(); }, [novelId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('internal-links-suggest', {
        body: { novel_id: novelId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (s: Suggestion) => {
    try {
      await supabase.from('internal_links').insert({
        source_novel_id: novelId,
        source_url: `/novel/${sourceSlug}`,
        target_novel_id: s.target_id,
        target_url: s.target_url,
        anchor_text: s.anchor_text,
        context: s.context,
        relevance_score: s.relevance_score,
        status: 'approved',
      });
      toast({ title: 'Link salvo!' });
      setSuggestions(prev => prev.filter(x => x !== s));
      loadExisting();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const addManual = async () => {
    if (!manual.anchor_text || !manual.target_url) {
      toast({ title: 'Erro', description: 'Preencha anchor text e URL de destino.', variant: 'destructive' });
      return;
    }
    setSavingManual(true);
    try {
      await supabase.from('internal_links').insert({
        source_novel_id: novelId,
        source_url: `/novel/${sourceSlug}`,
        target_url: manual.target_url,
        anchor_text: manual.anchor_text,
        context: manual.context || null,
        status: 'approved',
      });
      toast({ title: 'Link manual adicionado!' });
      setManual({ anchor_text: '', target_url: '', context: '' });
      loadExisting();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSavingManual(false);
    }
  };

  const deleteLink = async (id: string) => {
    try {
      await supabase.from('internal_links').delete().eq('id', id);
      setExisting(prev => prev.filter(l => l.id !== id));
      toast({ title: 'Link removido' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Manual entry */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Adicionar link manualmente</Label>
          <Input
            placeholder="Anchor text (ex: leia também...)"
            value={manual.anchor_text}
            onChange={e => setManual(p => ({ ...p, anchor_text: e.target.value }))}
            className="h-8 text-sm"
          />
          <Input
            placeholder="URL de destino (ex: /novel/outra-novel)"
            value={manual.target_url}
            onChange={e => setManual(p => ({ ...p, target_url: e.target.value }))}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Contexto (opcional)"
            value={manual.context}
            onChange={e => setManual(p => ({ ...p, context: e.target.value }))}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={addManual} disabled={savingManual} className="w-full">
            {savingManual ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Adicionar
          </Button>
        </CardContent>
      </Card>

      {/* AI suggestions */}
      <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <><Sparkles className="w-4 h-4 mr-2" />Sugerir Links com IA</>}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Sugestões IA ({suggestions.length})</p>
          {suggestions.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary truncate">{s.target_url}</span>
                      <Badge variant="secondary" className="text-xs">{s.relevance_score}%</Badge>
                    </div>
                    <p className="text-sm font-medium">"{s.anchor_text}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => acceptSuggestion(s)}><Check className="w-4 h-4 text-green-500" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSuggestions(prev => prev.filter(x => x !== s))}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Existing links */}
      {existing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Links salvos ({existing.length})</p>
          {existing.map(l => (
            <div key={l.id} className="flex items-center gap-2 bg-muted/30 rounded p-2 text-xs">
              <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">"{l.anchor_text}"</div>
                <div className="text-muted-foreground truncate">→ {l.target_url}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">{l.status}</Badge>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteLink(l.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

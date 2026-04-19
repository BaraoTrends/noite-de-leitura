import { useState } from 'react';
import { Link2, Loader2, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function InternalLinksSuggestions({ novelId }: { novelId: string }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();

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
      const { data: source } = await supabase.from('novels').select('slug').eq('id', novelId).single();
      await supabase.from('internal_links').insert({
        source_novel_id: novelId,
        source_url: `/novel/${source?.slug || ''}`,
        target_novel_id: s.target_id,
        target_url: s.target_url,
        anchor_text: s.anchor_text,
        context: s.context,
        relevance_score: s.relevance_score,
        status: 'approved',
      });
      toast({ title: 'Link salvo!' });
      setSuggestions(prev => prev.filter(x => x !== s));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <><Sparkles className="w-4 h-4 mr-2" />Sugerir Links Internos</>}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-2">
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
    </div>
  );
}

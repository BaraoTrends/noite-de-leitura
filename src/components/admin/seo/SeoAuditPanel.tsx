import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Info, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SerpPreview } from './SerpPreview';
import { OgPreview } from './OgPreview';

interface Props {
  novelId: string;
  novelSlug: string;
  metaTitle?: string;
  metaDescription?: string;
  thumbnailUrl?: string;
}

export function SeoAuditPanel({ novelId, novelSlug, metaTitle, metaDescription, thumbnailUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [audit, setAudit] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const { toast } = useToast();

  // Use freshly applied meta from auto-fix if present, otherwise current form values
  const previewTitle = (fixResult?.applied?.meta_title || metaTitle || '').trim();
  const previewDesc = (fixResult?.applied?.meta_description || metaDescription || '').trim();
  const previewUrl = `https://eroticsnovels.com/novel/${novelSlug}`;
  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

  const autoFix = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('seo-auto-fix', {
        body: { novel_id: novelId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFixResult(data);
      toast({ title: 'SEO corrigido!', description: 'Meta tags atualizadas. Rode a auditoria novamente para ver o novo score.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setFixing(false);
    }
  };

  const runAudit = async () => {
    setLoading(true);
    setAudit(null);
    try {
      const { data, error } = await supabase.functions.invoke('seo-audit', {
        body: { novel_id: novelId, url: `https://eroticsnovels.com/novel/${novelSlug}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAudit(data);
      toast({ title: 'Auditoria concluída!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sevIcon = (s: string) => s === 'high' ? <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> : s === 'medium' ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> : <Info className="w-3.5 h-3.5 text-muted-foreground" />;

  return (
    <div className="space-y-3">
      {(previewTitle || previewDesc) && (
        <div className="grid gap-3 md:grid-cols-2">
          <SerpPreview title={previewTitle} description={previewDesc} url={previewUrl} />
          <OgPreview title={previewTitle} description={previewDesc} url={previewUrl} image={thumbnailUrl} />
        </div>
      )}

      <Button variant="outline" size="sm" onClick={runAudit} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Auditando com IA...</> : <><Sparkles className="w-4 h-4 mr-2" />Rodar Auditoria SEO</>}
      </Button>

      {audit && (
        <div className="space-y-3">
          <Card><CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score</span>
              <span className={`font-display text-xl ${audit.score >= 80 ? 'text-green-500' : audit.score >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>{audit.score}/100</span>
            </div>
            <Progress value={audit.score} className="h-1.5" />
            {audit.ai_summary && <p className="text-xs text-muted-foreground italic mt-2">{audit.ai_summary}</p>}
          </CardContent></Card>

          {audit.issues?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Problemas ({audit.issues.length})</p>
              <div className="space-y-1.5">
                {audit.issues.map((i: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-muted/30 rounded p-2">
                    {sevIcon(i.severity)}
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] mb-0.5">{i.category}</Badge>
                      <p>{i.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audit.suggestions?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Sugestões</p>
              <div className="space-y-1.5">
                {audit.suggestions.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/20 rounded p-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{s.action}</p>
                      <p className="text-muted-foreground">{s.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={autoFix} disabled={fixing} size="sm" className="w-full">
            {fixing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Corrigindo com IA...</> : <><Wand2 className="w-4 h-4 mr-2" />Corrigir Automaticamente com IA</>}
          </Button>

          {fixResult && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-3 space-y-2 text-xs">
                <p className="font-medium flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />Correções aplicadas
                </p>
                <div className="space-y-1.5">
                  <div><span className="text-muted-foreground">Title:</span> {fixResult.applied?.meta_title}</div>
                  <div><span className="text-muted-foreground">Description:</span> {fixResult.applied?.meta_description}</div>
                  <div><span className="text-muted-foreground">Keywords:</span> {fixResult.applied?.meta_keywords}</div>
                </div>
                {fixResult.improvements?.length > 0 && (
                  <ul className="list-disc pl-4 text-muted-foreground space-y-0.5 mt-2">
                    {fixResult.improvements.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

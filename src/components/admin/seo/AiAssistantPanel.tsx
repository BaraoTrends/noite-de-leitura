import { useState } from 'react';
import { Wand2, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ACTIONS = [
  { value: 'rewrite', label: '✍️ Reescrever (mesmo tamanho)' },
  { value: 'improve', label: '✨ Melhorar (gramática, fluxo)' },
  { value: 'expand', label: '📖 Expandir (mais detalhes)' },
  { value: 'shorten', label: '✂️ Encurtar' },
  { value: 'summarize', label: '📝 Resumir' },
  { value: 'hook', label: '🎣 Gancho de abertura' },
  { value: 'seo', label: '🔍 SEO-friendly' },
  { value: 'translate_pt', label: '🇧🇷 Traduzir → PT-BR' },
  { value: 'translate_en', label: '🇺🇸 Traduzir → EN' },
];

interface Props {
  initialText?: string;
  onApply?: (text: string) => void;
}

export function AiAssistantPanel({ initialText = '', onApply }: Props) {
  const [text, setText] = useState(initialText);
  const [action, setAction] = useState('improve');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    if (!text.trim()) { toast({ title: 'Erro', description: 'Cole ou digite um texto.', variant: 'destructive' }); return; }
    setLoading(true);
    setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-assistant', {
        body: { action, text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Cole o trecho que deseja transformar..."
        rows={5}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        </Button>
      </div>

      {result && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3 h-3" />Resultado</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              {onApply && <Button size="sm" variant="outline" onClick={() => onApply(result)}>Aplicar</Button>}
            </div>
          </div>
          <div className="bg-muted/30 rounded p-3 text-sm whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}

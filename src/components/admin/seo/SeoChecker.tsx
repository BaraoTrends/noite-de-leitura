import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SeoCheckerProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  synopsis: string;
  content: string;
  thumbnail: string;
  slug: string;
  ageRating?: string;
  categories?: string;
  onChange?: (field: string, value: string) => void;
}

interface Check {
  key: string;
  label: string;
  status: 'good' | 'warning' | 'bad';
  hint?: string;
  editable?: boolean;
}

const FIELDS: Record<string, { label: string; field: string; type: 'input' | 'textarea' }> = {
  metaTitle: { label: 'Meta title', field: 'meta_title', type: 'input' },
  metaDescription: { label: 'Meta description', field: 'meta_description', type: 'textarea' },
  metaKeywords: { label: 'Keywords', field: 'meta_keywords', type: 'input' },
  slug: { label: 'Slug', field: 'slug', type: 'input' },
  thumbnail: { label: 'Imagem de capa (URL)', field: 'thumbnail_url', type: 'input' },
  synopsis: { label: 'Sinopse', field: 'synopsis', type: 'textarea' },
};

export function SeoChecker(props: SeoCheckerProps) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [score, setScore] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const list: Check[] = [];
    const t = props.metaTitle || props.title;
    const d = props.metaDescription || props.synopsis;

    if (!t) list.push({ key: 'metaTitle', label: 'Meta title', status: 'bad', hint: 'Faltando', editable: true });
    else if (t.length < 30) list.push({ key: 'metaTitle', label: `Meta title (${t.length})`, status: 'warning', hint: 'Curto demais (<30)', editable: true });
    else if (t.length > 60) list.push({ key: 'metaTitle', label: `Meta title (${t.length})`, status: 'warning', hint: 'Longo demais (>60)', editable: true });
    else list.push({ key: 'metaTitle', label: `Meta title (${t.length})`, status: 'good', editable: true });

    if (!d) list.push({ key: 'metaDescription', label: 'Meta description', status: 'bad', hint: 'Faltando', editable: true });
    else if (d.length < 70) list.push({ key: 'metaDescription', label: `Meta description (${d.length})`, status: 'warning', hint: 'Curta demais (<70)', editable: true });
    else if (d.length > 160) list.push({ key: 'metaDescription', label: `Meta description (${d.length})`, status: 'warning', hint: 'Longa demais (>160)', editable: true });
    else list.push({ key: 'metaDescription', label: `Meta description (${d.length})`, status: 'good', editable: true });

    if (!props.metaKeywords) list.push({ key: 'metaKeywords', label: 'Keywords', status: 'warning', hint: 'Não definidas', editable: true });
    else list.push({ key: 'metaKeywords', label: `Keywords (${props.metaKeywords.split(',').length})`, status: 'good', editable: true });

    if (!props.slug) list.push({ key: 'slug', label: 'Slug', status: 'bad', hint: 'Faltando', editable: true });
    else if (props.slug.length > 60) list.push({ key: 'slug', label: 'Slug', status: 'warning', hint: 'Longo demais', editable: true });
    else if (!/^[a-z0-9-]+$/.test(props.slug)) list.push({ key: 'slug', label: 'Slug', status: 'warning', hint: 'Caracteres inválidos', editable: true });
    else list.push({ key: 'slug', label: 'Slug', status: 'good', editable: true });

    list.push(props.thumbnail
      ? { key: 'thumbnail', label: 'Imagem de capa', status: 'good', editable: true }
      : { key: 'thumbnail', label: 'Imagem de capa', status: 'bad', hint: 'Faltando', editable: true });

    const cl = (props.content || '').length;
    if (cl === 0) list.push({ key: 'content', label: 'Conteúdo', status: 'bad', hint: 'Vazio' });
    else if (cl < 300) list.push({ key: 'content', label: `Conteúdo (${cl})`, status: 'warning', hint: 'Curto (<300 chars)' });
    else list.push({ key: 'content', label: `Conteúdo (${cl} chars)`, status: 'good' });

    if (!props.synopsis) list.push({ key: 'synopsis', label: 'Sinopse', status: 'bad', hint: 'Faltando', editable: true });
    else if (props.synopsis.length < 50) list.push({ key: 'synopsis', label: 'Sinopse', status: 'warning', hint: 'Curta demais', editable: true });
    else list.push({ key: 'synopsis', label: 'Sinopse', status: 'good', editable: true });

    setChecks(list);
    const goodCount = list.filter(c => c.status === 'good').length;
    setScore(Math.round((goodCount / list.length) * 100));
  }, [props.title, props.metaTitle, props.metaDescription, props.metaKeywords, props.synopsis, props.content, props.thumbnail, props.slug]);

  const scoreColor = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-destructive';

  const getValue = (key: string) => {
    switch (key) {
      case 'metaTitle': return props.metaTitle;
      case 'metaDescription': return props.metaDescription;
      case 'metaKeywords': return props.metaKeywords;
      case 'slug': return props.slug;
      case 'thumbnail': return props.thumbnail;
      case 'synopsis': return props.synopsis;
      default: return '';
    }
  };

  const handleAiFix = async () => {
    if (!props.title) { toast({ title: 'Erro', description: 'Preencha o título primeiro.', variant: 'destructive' }); return; }
    if (!props.onChange) return;
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-novel-seo', {
        body: { title: props.title, synopsis: props.synopsis, categories: props.categories || '', age_rating: props.ageRating || 'Livre' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.meta_title) props.onChange('meta_title', data.meta_title);
      if (data.meta_description) props.onChange('meta_description', data.meta_description);
      if (data.meta_keywords) props.onChange('meta_keywords', data.meta_keywords);
      toast({ title: 'SEO corrigido com IA!', description: 'Revise os campos e salve.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">SEO Score</span>
        <span className={`font-display text-2xl ${scoreColor}`}>{score}/100</span>
      </div>

      {props.onChange && (
        <Button size="sm" onClick={handleAiFix} disabled={fixing} className="w-full">
          {fixing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Corrigindo...</> : <><Wand2 className="w-4 h-4 mr-2" />Corrigir tudo com IA</>}
        </Button>
      )}

      <div className="space-y-1.5">
        {checks.map((c) => {
          const isEditable = c.editable && props.onChange;
          const isOpen = expanded[c.key];
          const fieldDef = FIELDS[c.key];
          return (
            <div key={c.key} className="rounded border border-border/50">
              <button
                type="button"
                onClick={() => isEditable && setExpanded(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
                className={`w-full flex items-start gap-2 text-sm p-2 ${isEditable ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default'}`}
              >
                {c.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                {c.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
                {c.status === 'bad' && <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
                <div className="flex-1 text-left">
                  <span className="text-foreground">{c.label}</span>
                  {c.hint && <span className="text-muted-foreground ml-2 text-xs">— {c.hint}</span>}
                </div>
                {isEditable && (isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />)}
              </button>
              {isEditable && isOpen && fieldDef && (
                <div className="px-2 pb-2 pt-1 space-y-1.5 border-t border-border/50 bg-muted/20">
                  <Label className="text-xs">{fieldDef.label}</Label>
                  {fieldDef.type === 'textarea' ? (
                    <Textarea
                      value={getValue(c.key)}
                      onChange={e => props.onChange!(fieldDef.field, e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  ) : (
                    <Input
                      value={getValue(c.key)}
                      onChange={e => props.onChange!(fieldDef.field, e.target.value)}
                      className="text-sm h-8"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

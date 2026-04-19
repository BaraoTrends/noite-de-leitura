import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface SeoCheckerProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  synopsis: string;
  content: string;
  thumbnail: string;
  slug: string;
}

interface Check {
  label: string;
  status: 'good' | 'warning' | 'bad';
  hint?: string;
}

export function SeoChecker(props: SeoCheckerProps) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const list: Check[] = [];
    const t = props.metaTitle || props.title;
    const d = props.metaDescription || props.synopsis;

    // Meta title
    if (!t) list.push({ label: 'Meta title', status: 'bad', hint: 'Faltando' });
    else if (t.length < 30) list.push({ label: `Meta title (${t.length})`, status: 'warning', hint: 'Curto demais (<30)' });
    else if (t.length > 60) list.push({ label: `Meta title (${t.length})`, status: 'warning', hint: 'Longo demais (>60)' });
    else list.push({ label: `Meta title (${t.length})`, status: 'good' });

    // Meta description
    if (!d) list.push({ label: 'Meta description', status: 'bad', hint: 'Faltando' });
    else if (d.length < 70) list.push({ label: `Meta description (${d.length})`, status: 'warning', hint: 'Curta demais (<70)' });
    else if (d.length > 160) list.push({ label: `Meta description (${d.length})`, status: 'warning', hint: 'Longa demais (>160)' });
    else list.push({ label: `Meta description (${d.length})`, status: 'good' });

    // Keywords
    if (!props.metaKeywords) list.push({ label: 'Keywords', status: 'warning', hint: 'Não definidas' });
    else list.push({ label: `Keywords (${props.metaKeywords.split(',').length})`, status: 'good' });

    // Slug
    if (!props.slug) list.push({ label: 'Slug', status: 'bad', hint: 'Faltando' });
    else if (props.slug.length > 60) list.push({ label: 'Slug', status: 'warning', hint: 'Longo demais' });
    else if (!/^[a-z0-9-]+$/.test(props.slug)) list.push({ label: 'Slug', status: 'warning', hint: 'Caracteres inválidos' });
    else list.push({ label: 'Slug', status: 'good' });

    // Cover
    list.push(props.thumbnail
      ? { label: 'Imagem de capa', status: 'good' }
      : { label: 'Imagem de capa', status: 'bad', hint: 'Faltando' });

    // Content length
    const cl = (props.content || '').length;
    if (cl === 0) list.push({ label: 'Conteúdo', status: 'bad', hint: 'Vazio' });
    else if (cl < 300) list.push({ label: `Conteúdo (${cl})`, status: 'warning', hint: 'Curto (<300 chars)' });
    else list.push({ label: `Conteúdo (${cl} chars)`, status: 'good' });

    // Synopsis
    if (!props.synopsis) list.push({ label: 'Sinopse', status: 'bad', hint: 'Faltando' });
    else if (props.synopsis.length < 50) list.push({ label: 'Sinopse', status: 'warning', hint: 'Curta demais' });
    else list.push({ label: 'Sinopse', status: 'good' });

    setChecks(list);
    const goodCount = list.filter(c => c.status === 'good').length;
    setScore(Math.round((goodCount / list.length) * 100));
  }, [props.title, props.metaTitle, props.metaDescription, props.metaKeywords, props.synopsis, props.content, props.thumbnail, props.slug]);

  const scoreColor = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-destructive';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">SEO Score</span>
        <span className={`font-display text-2xl ${scoreColor}`}>{score}/100</span>
      </div>
      <div className="space-y-1.5">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {c.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
            {c.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
            {c.status === 'bad' && <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <span className="text-foreground">{c.label}</span>
              {c.hint && <span className="text-muted-foreground ml-2 text-xs">— {c.hint}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

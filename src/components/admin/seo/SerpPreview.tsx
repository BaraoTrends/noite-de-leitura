interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
  label?: string;
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

export function SerpPreview({ title, description, url, label = 'Pré-visualização SERP (Google)' }: SerpPreviewProps) {
  const t = (title || '').trim();
  const d = (description || '').trim();
  const cleanUrl = url.replace(/^https?:\/\//, '');
  const [host, ...rest] = cleanUrl.split('/');
  const breadcrumb = rest.length ? ` › ${rest.filter(Boolean).join(' › ')}` : '';

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{label}</p>
      <div className="rounded-lg border bg-background p-3 font-sans">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">E</div>
          <div className="leading-tight min-w-0">
            <div className="text-xs text-foreground">Erotics Novels</div>
            <div className="text-[11px] text-muted-foreground truncate">{host}{breadcrumb}</div>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-snug hover:underline truncate"
        >
          {truncate(t || 'Sem meta título definido', 60)}
        </a>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="text-foreground/70">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} —{' '}
          </span>
          {truncate(d || 'Sem meta descrição definida. Adicione uma para melhorar o CTR nos resultados de busca.', 160)}
        </p>
      </div>
      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span className={t.length > 60 ? 'text-destructive' : t.length < 30 ? 'text-yellow-500' : ''}>
          Título: {t.length}/60
        </span>
        <span className={d.length > 160 ? 'text-destructive' : d.length < 120 ? 'text-yellow-500' : ''}>
          Descrição: {d.length}/160
        </span>
      </div>
    </div>
  );
}

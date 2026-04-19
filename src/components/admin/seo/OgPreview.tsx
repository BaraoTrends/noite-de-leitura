import { useState } from 'react';
import { Facebook, Twitter, MessageCircle, ImageOff } from 'lucide-react';

interface OgPreviewProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  siteName?: string;
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

type Variant = 'facebook' | 'twitter' | 'whatsapp';

export function OgPreview({
  title,
  description,
  url,
  image,
  siteName = 'eroticsnovels.com',
}: OgPreviewProps) {
  const [variant, setVariant] = useState<Variant>('facebook');
  const [imgErr, setImgErr] = useState(false);
  const t = (title || '').trim();
  const d = (description || '').trim();
  const host = url.replace(/^https?:\/\//, '').split('/')[0];

  const tabs: { id: Variant; label: string; icon: any }[] = [
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'twitter', label: 'X / Twitter', icon: Twitter },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ];

  const ImageBlock = ({ heightClass }: { heightClass: string }) =>
    image && !imgErr ? (
      <img
        src={image}
        alt=""
        onError={() => setImgErr(true)}
        className={`w-full ${heightClass} object-cover bg-muted`}
      />
    ) : (
      <div className={`w-full ${heightClass} bg-muted flex items-center justify-center text-muted-foreground`}>
        <ImageOff className="w-6 h-6" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-visualização Social (OG)</p>
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = variant === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setVariant(tab.id)}
                title={tab.label}
                className={`p-1 rounded transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {variant === 'facebook' && (
        <div className="rounded-lg border bg-background overflow-hidden font-sans">
          <ImageBlock heightClass="h-40" />
          <div className="p-3 bg-muted/40 border-t">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{host}</div>
            <div className="text-sm font-semibold text-foreground leading-snug mt-0.5">
              {truncate(t || 'Sem título', 88)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {truncate(d || 'Sem descrição', 200)}
            </div>
          </div>
        </div>
      )}

      {variant === 'twitter' && (
        <div className="rounded-2xl border bg-background overflow-hidden font-sans">
          <ImageBlock heightClass="h-44" />
          <div className="p-3">
            <div className="text-xs text-muted-foreground">{host}</div>
            <div className="text-sm text-foreground leading-snug mt-0.5">
              {truncate(t || 'Sem título', 70)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {truncate(d || 'Sem descrição', 200)}
            </div>
          </div>
        </div>
      )}

      {variant === 'whatsapp' && (
        <div className="rounded-lg overflow-hidden font-sans" style={{ background: '#005c4b' }}>
          <div className="p-2 bg-black/20">
            <div className="rounded-md overflow-hidden bg-white/95">
              <ImageBlock heightClass="h-32" />
              <div className="p-2">
                <div className="text-sm font-medium text-neutral-900 leading-snug truncate">
                  {truncate(t || 'Sem título', 65)}
                </div>
                <div className="text-xs text-neutral-700 mt-0.5 line-clamp-2">
                  {truncate(d || 'Sem descrição', 160)}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 truncate">{host}</div>
              </div>
            </div>
            <div className="text-[11px] text-white/90 mt-1 px-1 break-all">{url}</div>
          </div>
        </div>
      )}

      {!image && (
        <p className="text-[10px] text-yellow-500 mt-1.5">
          Sem og:image / thumbnail. Adicione uma imagem 1200×630px para melhor compartilhamento.
        </p>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PromoSlotProps {
  variant?: 'horizontal' | 'sidebar' | 'inline';
  className?: string;
  limit?: number;
}

export function PromoSlot({ variant = 'horizontal', className, limit = 1 }: PromoSlotProps) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(limit);
      setBanners(data || []);
    };
    fetchBanners();
  }, [limit]);

  if (banners.length === 0) return null;

  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-4', className)}>
        {banners.map((banner) => {
          const content = (
            <div
              key={banner.id}
              className="relative rounded-xl overflow-hidden border border-border bg-card group hover:border-primary/50 transition-colors"
            >
              <div className="aspect-[4/3]">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-foreground">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{banner.subtitle}</p>
                )}
              </div>
            </div>
          );
          return banner.link_url ? (
            <Link key={banner.id} to={banner.link_url}>
              {content}
            </Link>
          ) : (
            <div key={banner.id}>{content}</div>
          );
        })}
      </div>
    );
  }

  if (variant === 'inline') {
    const banner = banners[0];
    const content = (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden border border-border bg-card group hover:border-primary/50 transition-colors',
          className
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
          <div className="w-full sm:w-48 h-28 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-foreground">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{banner.subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
    return banner.link_url ? <Link to={banner.link_url}>{content}</Link> : content;
  }

  // horizontal (default) – full-width strip
  const banner = banners[0];
  const content = (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border border-border bg-card group hover:border-primary/50 transition-colors',
        className
      )}
    >
      <div className="aspect-[16/4] sm:aspect-[16/3]">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-display font-semibold text-lg text-foreground">{banner.title}</p>
          {banner.subtitle && (
            <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
  return banner.link_url ? <Link to={banner.link_url}>{content}</Link> : content;
}

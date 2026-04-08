import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Crown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/SEOHead';
import { NovelCard } from '@/components/novel/NovelCard';
import { useNovels } from '@/hooks/useNovels';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { PromoSlot } from '@/components/PromoSlot';

const Popular = () => {
  const [trendingPage, setTrendingPage] = useState(1);
  const { novels: topNovels, loading: topLoading } = useNovels({ page: 1, pageSize: 8, sort: 'popular' });
  const { novels: highestRated, loading: ratedLoading } = useNovels({ page: 1, pageSize: 8, sort: 'rating' });
  const {
    novels: trendingNovels,
    loading: trendingLoading,
    totalPages: trendingTotalPages,
  } = useNovels({ page: trendingPage, pageSize: 8, sort: 'popular' });

  if (topLoading && ratedLoading && trendingLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading novels...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Popular Novels</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">The most loved stories by our readers.</p>
        </motion.div>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="font-display text-2xl font-bold text-foreground">Most Read</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topNovels.map((novel, index) => (
              <div key={novel.id} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                )}
                <NovelCard novel={novel} index={index} />
              </div>
            ))}
          </div>
        </section>

        <PromoSlot variant="inline" className="mb-16" />

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-6 h-6 text-gold" />
            <h2 className="font-display text-2xl font-bold text-foreground">Highest Rated</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {highestRated.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-accent" />
            <h2 className="font-display text-2xl font-bold text-foreground">Trending This Week</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingNovels.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
          <PaginationControls className="mt-10" page={trendingPage} totalPages={trendingTotalPages} onPageChange={setTrendingPage} />
        </section>
      </div>
    </Layout>
  );
};

export default Popular;

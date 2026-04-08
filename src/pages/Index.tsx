import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { NovelCard } from '@/components/novel/NovelCard';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { TopNovels } from '@/components/home/TopNovels';
import { FeaturedAuthors } from '@/components/home/FeaturedAuthors';
import { YouTubeWidget } from '@/components/home/YouTubeWidget';
import { useNovels } from '@/hooks/useNovels';
import { useStore } from '@/store/useStore';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { PromoSlot } from '@/components/PromoSlot';

const Index = () => {
  const { selectedCategories } = useStore();
  const { novels, featuredNovels, topNovels, newNovels: allNewNovels, loading } = useNovels();

  const filteredNovels = useMemo(() => {
    if (selectedCategories.length === 0) return novels;
    return novels.filter((novel) =>
      novel.categories.some((cat) => selectedCategories.includes(cat))
    );
  }, [selectedCategories, novels]);

  const newNovels = filteredNovels.filter((n) => n.isNew);
  const trendingNovels = [...filteredNovels].sort((a, b) => b.views - a.views).slice(0, 8);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {featuredNovels.length > 0 && <HeroCarousel novels={featuredNovels} />}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {trendingNovels.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-gold" />
                  <h2 className="font-display text-2xl font-bold text-foreground">Trending</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {trendingNovels.map((novel, index) => (
                    <NovelCard key={novel.id} novel={novel} index={index} />
                  ))}
                </div>
              </section>
            )}

            <PromoSlot variant="horizontal" className="mb-12" />

            {newNovels.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-purple-accent" />
                  <h2 className="font-display text-2xl font-bold text-foreground">New Releases</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {newNovels.map((novel, index) => (
                    <NovelCard key={novel.id} novel={novel} index={index} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-muted-foreground" />
                <h2 className="font-display text-2xl font-bold text-foreground">
                  All Novels
                  {selectedCategories.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({filteredNovels.length} results)
                    </span>
                  )}
                </h2>
              </div>
              {filteredNovels.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Nenhum novel encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredNovels.map((novel, index) => (
                    <NovelCard key={novel.id} novel={novel} index={index} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              <CategoryFilter />
              {topNovels.length > 0 && <TopNovels novels={topNovels} />}
              <PromoSlot variant="sidebar" limit={2} />
              <FeaturedAuthors authors={[]} />
              <YouTubeWidget />
              <YouTubeWidget />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Index;

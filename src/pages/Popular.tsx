import { motion } from 'framer-motion';
import { TrendingUp, Flame, Crown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { getTopNovels, novels } from '@/data/novels';

const Popular = () => {
  const topNovels = getTopNovels(20);
  const highestRated = [...novels].sort((a, b) => b.rating - a.rating).slice(0, 10);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Novels Populares
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            As histórias mais amadas pelos nossos leitores.
          </p>
        </motion.div>

        {/* Most Viewed */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Mais Lidas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topNovels.slice(0, 8).map((novel, index) => (
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

        {/* Highest Rated */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-6 h-6 text-gold" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Melhor Avaliadas
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {highestRated.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-accent" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Em Alta Esta Semana
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topNovels.slice(0, 12).map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Popular;

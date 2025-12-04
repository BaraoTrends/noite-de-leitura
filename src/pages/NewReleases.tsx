import { motion } from 'framer-motion';
import { Sparkles, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { novels } from '@/data/novels';

const NewReleases = () => {
  const newNovels = novels.filter((n) => n.isNew);
  const recentNovels = [...novels]
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 20);

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
            Lançamentos
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            As histórias mais recentes publicadas em nossa plataforma.
          </p>
        </motion.div>

        {/* New Releases */}
        {newNovels.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-accent" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Novidades
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newNovels.map((novel, index) => (
                <NovelCard key={novel.id} novel={novel} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Publications */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-muted-foreground" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Publicações Recentes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentNovels.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default NewReleases;

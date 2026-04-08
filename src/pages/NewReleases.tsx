import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { useNovels } from '@/hooks/useNovels';
import { PaginationControls } from '@/components/ui/pagination-controls';

const NewReleases = () => {
  const [newPage, setNewPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const {
    novels: newNovels,
    loading: newLoading,
    totalPages: newTotalPages,
  } = useNovels({ page: newPage, pageSize: 8, sort: 'newest', onlyNew: true });
  const {
    novels: recentNovels,
    loading: recentLoading,
    totalPages: recentTotalPages,
  } = useNovels({ page: recentPage, pageSize: 8, sort: 'newest' });

  if (newLoading && recentLoading) {
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
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">New Releases</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">The latest stories published on our platform.</p>
        </motion.div>

        {newNovels.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-accent" />
              <h2 className="font-display text-2xl font-bold text-foreground">What's New</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newNovels.map((novel, index) => (
                <NovelCard key={novel.id} novel={novel} index={index} />
              ))}
            </div>
            <PaginationControls className="mt-10" page={newPage} totalPages={newTotalPages} onPageChange={setNewPage} />
          </section>
        )}

        <section>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-muted-foreground" />
            <h2 className="font-display text-2xl font-bold text-foreground">Recent Publications</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentNovels.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
          <PaginationControls className="mt-10" page={recentPage} totalPages={recentTotalPages} onPageChange={setRecentPage} />
        </section>
      </div>
    </Layout>
  );
};

export default NewReleases;

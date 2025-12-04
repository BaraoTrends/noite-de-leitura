import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Grid, List } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { NovelCard } from '@/components/novel/NovelCard';
import { Button } from '@/components/ui/button';
import { getNovelsByCategory } from '@/data/novels';
import { CATEGORIES } from '@/types/novel';
import { cn } from '@/lib/utils';

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const decodedCategory = decodeURIComponent(category || '');
  const novels = getNovelsByCategory(decodedCategory);
  
  const isValidCategory = CATEGORIES.includes(decodedCategory as any);

  if (!isValidCategory) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Categoria não encontrada</h1>
          <p className="text-muted-foreground mb-8">A categoria "{decodedCategory}" não existe.</p>
          <Link to="/categorias">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Ver todas as categorias
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/categorias" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Categorias
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {decodedCategory}
              </h1>
              <p className="text-muted-foreground">
                {novels.length} {novels.length === 1 ? 'novel encontrada' : 'novels encontradas'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Novels Grid */}
        {novels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Nenhuma novel encontrada nesta categoria.</p>
            <Link to="/">
              <Button variant="outline">Explorar todas as novels</Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {novels.map((novel, index) => (
              <NovelCard 
                key={novel.id} 
                novel={novel} 
                index={index} 
                variant={viewMode === 'list' ? 'featured' : 'default'}
              />
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Category;

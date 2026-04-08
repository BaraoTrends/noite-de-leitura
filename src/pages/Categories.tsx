import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Wand2, Theater, Compass, Rocket, 
  AlertTriangle, Skull, Search, Ghost, Laugh, Sword, History
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/SEOHead';
import { useNovels } from '@/hooks/useNovels';
import { CATEGORIES } from '@/types/novel';

const categoryIcons: Record<string, React.ReactNode> = {
  'Romance': <Heart className="w-8 h-8" />,
  'Fantasia': <Wand2 className="w-8 h-8" />,
  'Drama': <Theater className="w-8 h-8" />,
  'Aventura': <Compass className="w-8 h-8" />,
  'Ficção Científica': <Rocket className="w-8 h-8" />,
  'Suspense': <AlertTriangle className="w-8 h-8" />,
  'Thriller': <Skull className="w-8 h-8" />,
  'Mistério': <Search className="w-8 h-8" />,
  'Terror': <Ghost className="w-8 h-8" />,
  'Comédia': <Laugh className="w-8 h-8" />,
  'Ação': <Sword className="w-8 h-8" />,
  'Histórico': <History className="w-8 h-8" />,
};

const Categories = () => {
  const { novels, loading } = useNovels();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Categories</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Explore our categories and find the perfect story for you.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CATEGORIES.map((category, index) => {
            const count = novels.filter((novel) => novel.categories.includes(category)).length;
            return (
              <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={`/categoria/${encodeURIComponent(category)}`} className="block group">
                  <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-accent/20 to-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                      {categoryIcons[category]}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{category}</h3>
                    <p className="text-sm text-muted-foreground">{count} {count === 1 ? 'novel' : 'novels'}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;

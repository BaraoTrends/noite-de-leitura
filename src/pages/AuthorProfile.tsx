import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen, Eye, Users, Twitter, Instagram, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { NovelCard } from '@/components/novel/NovelCard';
import { authors, getNovelsByAuthor } from '@/data/novels';

const AuthorProfile = () => {
  const { id } = useParams<{ id: string }>();
  
  const author = authors.find((a) => a.id === id);
  const authorNovels = author ? getNovelsByAuthor(author.id) : [];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!author) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Autor não encontrado</h1>
          <Link to="/">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar para o início
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <img
                src={author.avatar}
                alt={author.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/30 object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center md:text-left flex-1"
            >
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {author.name}
              </h1>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                {author.bio}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{author.novelsCount}</span>
                  <span className="text-muted-foreground">novels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{formatNumber(author.totalViews || 0)}</span>
                  <span className="text-muted-foreground">visualizações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{formatNumber(author.followers || 0)}</span>
                  <span className="text-muted-foreground">seguidores</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button variant="gold">
                  <Users className="w-4 h-4 mr-2" />
                  Seguir
                </Button>
                {author.socialLinks?.twitter && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={author.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {author.socialLinks?.instagram && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={author.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {author.socialLinks?.website && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={author.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Novels */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Novels de {author.name}
          </h2>
        </div>

        {authorNovels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Este autor ainda não publicou nenhuma novel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {authorNovels.map((novel, index) => (
              <NovelCard key={novel.id} novel={novel} index={index} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AuthorProfile;

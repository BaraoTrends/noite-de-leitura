import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, BookOpen, Eye } from 'lucide-react';
import { Author } from '@/types/novel';

interface FeaturedAuthorsProps {
  authors: Author[];
}

export function FeaturedAuthors({ authors }: FeaturedAuthorsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-purple-accent" />
        <h3 className="font-display font-semibold text-foreground">Autores em Destaque</h3>
      </div>
      
      <div className="space-y-4">
        {authors.slice(0, 5).map((author, index) => (
          <Link
            key={author.id}
            to={`/autor/${author.id}`}
            className="flex items-center gap-3 group"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <img
                src={author.avatar}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {author.name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {author.novelsCount}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(author.totalViews || 0)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

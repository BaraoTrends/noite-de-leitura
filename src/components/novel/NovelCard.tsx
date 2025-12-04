import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye, Clock, Heart, BookOpen } from 'lucide-react';
import { Novel } from '@/types/novel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface NovelCardProps {
  novel: Novel;
  index?: number;
  variant?: 'default' | 'compact' | 'featured';
}

export function NovelCard({ novel, index = 0, variant = 'default' }: NovelCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useStore();
  const favorite = isFavorite(novel.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) {
      removeFavorite(novel.id);
    } else {
      addFavorite(novel.id);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (variant === 'compact') {
    return (
      <Link to={`/novel/${novel.id}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
            <img
              src={novel.thumbnail}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {novel.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{novel.author.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-muted-foreground">{novel.rating}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatViews(novel.views)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/novel/${novel.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group relative bg-card rounded-xl overflow-hidden card-shadow border border-border/50 hover:border-primary/50 transition-all duration-300",
          variant === 'featured' && "lg:flex lg:h-80"
        )}
      >
        {/* Thumbnail */}
        <div className={cn(
          "relative aspect-[3/4] overflow-hidden",
          variant === 'featured' && "lg:w-56 lg:aspect-auto"
        )}>
          <img
            src={novel.thumbnail}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          {/* Age Rating Badge */}
          <Badge
            className={cn(
              "absolute top-3 left-3 text-xs font-bold",
              novel.ageRating === 'Livre' && "bg-green-500/90",
              novel.ageRating === '+12' && "bg-yellow-500/90",
              novel.ageRating === '+16' && "bg-orange-500/90",
              novel.ageRating === '+18' && "bg-red-500/90"
            )}
          >
            {novel.ageRating}
          </Badge>

          {/* New Badge */}
          {novel.isNew && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              Novo
            </Badge>
          )}

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            className="absolute bottom-3 right-3 w-8 h-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-destructive text-destructive")} />
          </Button>
        </div>

        {/* Content */}
        <div className={cn(
          "p-4",
          variant === 'featured' && "lg:flex-1 lg:p-6 lg:flex lg:flex-col lg:justify-between"
        )}>
          <div>
            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-2">
              {novel.categories.slice(0, 2).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs bg-purple-accent/20 text-purple-glow border-0">
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h3 className={cn(
              "font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2",
              variant === 'featured' ? "text-xl lg:text-2xl mb-3" : "text-base mb-2"
            )}>
              {novel.title}
            </h3>

            {/* Author */}
            <p className="text-sm text-muted-foreground mb-2">
              por <span className="text-foreground">{novel.author.name}</span>
            </p>

            {/* Synopsis (featured only) */}
            {variant === 'featured' && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {novel.synopsis}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span>{novel.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatViews(novel.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{novel.readTime} min</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

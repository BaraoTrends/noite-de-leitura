import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Novel } from '@/types/novel';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
  novels: Novel[];
}

export function HeroCarousel({ novels }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % novels.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [novels.length]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + novels.length) % novels.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % novels.length);
  };

  const currentNovel = novels[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <section className="relative h-[500px] lg:h-[600px] overflow-hidden bg-gradient-hero">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={currentNovel.thumbnail}
              alt={currentNovel.title}
              className="w-full h-full object-cover opacity-30 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
              {/* Text Content */}
              <div className="relative z-10 max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentNovel.categories.map((cat) => (
                      <Badge key={cat} className="bg-purple-accent/80 text-foreground border-0">
                        {cat}
                      </Badge>
                    ))}
                    <Badge
                      className={cn(
                        currentNovel.ageRating === 'Livre' && "bg-green-500/90",
                        currentNovel.ageRating === '+12' && "bg-yellow-500/90",
                        currentNovel.ageRating === '+16' && "bg-orange-500/90",
                        currentNovel.ageRating === '+18' && "bg-red-500/90"
                      )}
                    >
                      {currentNovel.ageRating}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="font-display text-3xl lg:text-5xl font-bold text-foreground mb-4">
                    {currentNovel.title}
                  </h1>

                  {/* Author */}
                  <p className="text-lg text-muted-foreground mb-4">
                    por <span className="text-gold font-medium">{currentNovel.author.name}</span>
                  </p>

                  {/* Synopsis */}
                  <p className="text-muted-foreground line-clamp-3 mb-6">
                    {currentNovel.synopsis}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-gold fill-gold" />
                      <span className="text-foreground font-medium">{currentNovel.rating}</span>
                      <span className="text-muted-foreground">({currentNovel.ratingCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{formatViews(currentNovel.views)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link to={`/novel/${currentNovel.id}`}>
                    <Button variant="hero" className="group">
                      <BookOpen className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                      Ler Agora
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Image */}
              <div className="hidden lg:flex justify-end">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  <div className="w-72 h-96 rounded-2xl overflow-hidden card-shadow border-2 border-gold/30">
                    <img
                      src={currentNovel.thumbnail}
                      alt={currentNovel.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -bottom-4 -right-4 w-72 h-96 rounded-2xl border-2 border-purple-accent/30 -z-10" />
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-gold/20 rounded-full blur-2xl" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="bg-background/50 backdrop-blur-sm border-border hover:bg-background/80"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="bg-background/50 backdrop-blur-sm border-border hover:bg-background/80"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {novels.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-gold w-8"
                : "bg-muted-foreground/50 hover:bg-muted-foreground"
            )}
          />
        ))}
      </div>
    </section>
  );
}

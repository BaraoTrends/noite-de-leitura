import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useChaptersByNovel } from '@/hooks/useChapters';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { 
  Star, Eye, Clock, Heart, Share2, BookOpen, 
  ChevronLeft, Plus, Minus, Youtube, MessageCircle,
  Calendar, User
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/novel/Rating';
import { NovelCard } from '@/components/novel/NovelCard';
import { PromoSlot } from '@/components/PromoSlot';
import { SEOHead } from '@/components/SEOHead';
import { useNovelById, useNovels } from '@/hooks/useNovels';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AIGenerateChaptersDialog } from '@/components/ai/AIGenerateChaptersDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NovelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [fontSize, setFontSize] = useState(18);
  const [isImmersive, setIsImmersive] = useState(false);
  const { isFavorite, addFavorite, removeFavorite, addToHistory } = useStore();
  
  const { novel, loading } = useNovelById(id);
  const { novels: allNovels } = useNovels();
  const { chapters } = useChaptersByNovel(id);
  const { user } = useAuth();
  const favorite = novel ? isFavorite(novel.id) : false;
  const relatedNovels = allNovels.filter((n) => novel && n.id !== novel.id && n.categories.some((c) => novel.categories.includes(c))).slice(0, 4);
  const authorNovelCount = novel ? allNovels.filter((n) => n.author.id === novel.author.id).length : 0;

  const sanitizedContent = useMemo(() => {
    if (!novel) return '';
    const formattedContent = novel.content
      .replace(/\n/g, '<br/>')
      .replace(/## (.*?)$/gm, '<h2 class="font-display text-2xl mt-8 mb-4 text-foreground">$1</h2>')
      .replace(/# (.*?)$/gm, '<h1 class="font-display text-3xl mt-8 mb-4 text-foreground">$1</h1>');
    return DOMPurify.sanitize(formattedContent, { ALLOWED_TAGS: ['br', 'h1', 'h2', 'p', 'strong', 'em', 'span'], ALLOWED_ATTR: ['class'] });
  }, [novel]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatViews = (views: number) => { if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`; if (views >= 1000) return `${(views / 1000).toFixed(1)}K`; return views.toString(); };

  useEffect(() => {
    if (novel) { addToHistory(novel.id); }
  }, [novel, addToHistory]);

  if (loading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Loading...</p></div></Layout>;
  }

  if (!novel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Novel not found</h1>
          <Link to="/"><Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" />Back to Home</Button></Link>
        </div>
      </Layout>
    );
  }

  const handleFavorite = () => { if (favorite) { removeFavorite(novel.id); } else { addFavorite(novel.id); } };

  if (isImmersive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setFontSize((s) => Math.max(14, s - 2))}><Minus className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setFontSize((s) => Math.min(28, s + 2))}><Plus className="w-4 h-4" /></Button>
          <Button variant="outline" onClick={() => setIsImmersive(false)}>Exit</Button>
        </div>
        <article className="max-w-3xl mx-auto px-8 py-20 prose prose-invert prose-lg" style={{ fontSize: `${fontSize}px` }}>
          <h1 className="font-display text-4xl text-foreground mb-8">{novel.title}</h1>
          <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>
      </div>
    );
  }

  const novelJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: novel.title,
      description: novel.synopsis,
      image: novel.thumbnail,
      author: { '@type': 'Person', name: novel.author.name, url: `https://eroticsnovels.com/autor/${novel.author.id}` },
      datePublished: novel.publishDate,
      dateModified: novel.publishDate,
      publisher: { '@type': 'Organization', name: 'Erotics Novels', url: 'https://eroticsnovels.com' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://eroticsnovels.com/novel/${novel.id}` },
      genre: novel.categories,
      keywords: novel.tags.join(', '),
      wordCount: novel.content.split(/\s+/).length,
      timeRequired: `PT${novel.readTime}M`,
      interactionStatistic: [
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ReadAction', userInteractionCount: novel.views },
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: novel.commentsCount || 0 },
      ],
      aggregateRating: novel.ratingCount > 0 ? { '@type': 'AggregateRating', ratingValue: novel.rating, bestRating: 5, worstRating: 1, ratingCount: novel.ratingCount } : undefined,
      contentRating: novel.ageRating,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://eroticsnovels.com' },
        ...(novel.categories[0] ? [{ '@type': 'ListItem', position: 2, name: novel.categories[0], item: `https://eroticsnovels.com/categoria/${encodeURIComponent(novel.categories[0])}` }] : []),
        { '@type': 'ListItem', position: novel.categories[0] ? 3 : 2, name: novel.title },
      ],
    },
    ...(novel.seoExtras?.schema_book ? [novel.seoExtras.schema_book] : []),
  ];

  const headline = novel.seoExtras?.h1_suggestion || novel.title;
  const coverAlt = novel.seoExtras?.image_alt || novel.title;

  return (
    <Layout>
      <SEOHead
        title={novel.title}
        description={novel.synopsis.substring(0, 155)}
        canonicalUrl={`/novel/${novel.id}`}
        ogType="article"
        ogImage={novel.thumbnail}
        keywords={novel.tags.join(', ')}
        jsonLd={novelJsonLd}
      />
      <section className="relative py-12 bg-gradient-hero">
        <div className="absolute inset-0">
          <img src={novel.thumbnail} alt={novel.title} className="w-full h-full object-cover opacity-20 blur-md" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />Back
          </Link>
          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0">
              <div className="w-64 h-80 rounded-xl overflow-hidden card-shadow border-2 border-primary/30 mx-auto lg:mx-0">
                <img src={novel.thumbnail} alt={novel.title} className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {novel.categories.map((cat) => (<Badge key={cat} className="bg-purple-accent/80 text-foreground border-0">{cat}</Badge>))}
                <Badge className={cn(novel.ageRating === 'Livre' && "bg-green-500/90", novel.ageRating === '+12' && "bg-yellow-500/90", novel.ageRating === '+16' && "bg-orange-500/90", novel.ageRating === '+18' && "bg-red-500/90")}>{novel.ageRating}</Badge>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">{novel.title}</h1>
              <Link to={`/autor/${novel.author.id}`} className="flex items-center gap-3 mb-6 group">
                <img src={novel.author.avatar} alt={novel.author.name} className="w-10 h-10 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
                <div>
                  <p className="text-sm text-muted-foreground">Written by</p>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">{novel.author.name}</p>
                </div>
              </Link>
              <p className="text-muted-foreground leading-relaxed mb-6">{novel.synopsis}</p>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2"><Rating value={novel.rating} showValue /><span className="text-sm text-muted-foreground">({novel.ratingCount} ratings)</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Eye className="w-4 h-4" /><span>{formatViews(novel.views)} views</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>{novel.readTime} min read</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span>{formatDate(novel.publishDate)}</span></div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {novel.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" onClick={() => setIsImmersive(true)}><BookOpen className="w-5 h-5 mr-2" />Read Now</Button>
                <Button variant={favorite ? "default" : "outline"} onClick={handleFavorite}>
                  <Heart className={cn("w-4 h-4 mr-2", favorite && "fill-current")} />{favorite ? 'Favorited' : 'Favorite'}
                </Button>
                <Button variant="outline"><Share2 className="w-4 h-4 mr-2" />Share</Button>
                {novel.youtubeVideoId && (<Button variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-500/10"><Youtube className="w-4 h-4 mr-2" />Listen</Button>)}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8 p-4 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Font size:</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.max(14, s - 2))}><Minus className="w-4 h-4" /></Button>
                  <span className="w-8 text-center">{fontSize}</span>
                  <Button variant="ghost" size="icon" onClick={() => setFontSize((s) => Math.min(28, s + 2))}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsImmersive(true)}>Reading Mode</Button>
            </div>
            <PromoSlot variant="inline" className="mb-6" />

            {/* Chapters list */}
            {chapters.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Capítulos ({chapters.length})
                  </h2>
                  {user && novel && (
                    <AIGenerateChaptersDialog
                      novelTitle={novel.title}
                      novelSynopsis={novel.synopsis}
                      novelId={novel.id}
                      onGenerated={async (genChapters) => {
                        for (const ch of genChapters) {
                          await supabase.from('chapters').insert({
                            novel_id: novel.id,
                            title: ch.title,
                            chapter_order: ch.chapter_order,
                            content: ch.content,
                            status: 'draft',
                          });
                        }
                        window.location.reload();
                      }}
                    />
                  )}
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      to={`/novel/${novel.id}/capitulo/${ch.id}`}
                      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        Cap. {ch.chapter_order} — {ch.title}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <article className="prose prose-invert prose-lg max-w-none bg-card rounded-xl p-8 border border-border" style={{ fontSize: `${fontSize}px` }}>
              <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
            </article>
            <PromoSlot variant="horizontal" className="mt-8" />
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-muted-foreground" />
                <h2 className="font-display text-2xl font-bold text-foreground">Comments ({novel.commentsCount})</h2>
              </div>
              <div className="bg-card rounded-xl p-8 border border-border text-center">
                <p className="text-muted-foreground mb-4">Sign in to comment and join the discussion.</p>
                <Button variant="outline">Sign In</Button>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              <PromoSlot variant="sidebar" limit={1} />
              {novel.youtubeVideoId && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-2 mb-4"><Youtube className="w-5 h-5 text-red-500" /><h3 className="font-display font-semibold text-foreground">Narrated Version</h3></div>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${novel.youtubeVideoId}`} title="Narration" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                </div>
              )}
              {relatedNovels.length > 0 && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-display font-semibold text-foreground mb-4">Related Novels</h3>
                  <div className="space-y-4">{relatedNovels.map((n, index) => (<NovelCard key={n.id} novel={n} index={index} variant="compact" />))}</div>
                </div>
              )}
              <Link to={`/autor/${novel.author.id}`} className="block">
                <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={novel.author.avatar} alt={novel.author.name} className="w-16 h-16 rounded-full border-2 border-border" />
                    <div>
                      <p className="text-sm text-muted-foreground">Author</p>
                      <h4 className="font-display font-semibold text-foreground">{novel.author.name}</h4>
                       <p className="text-sm text-muted-foreground">{authorNovelCount} novels</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4"><User className="w-4 h-4 mr-2" />View Profile</Button>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export default NovelDetail;

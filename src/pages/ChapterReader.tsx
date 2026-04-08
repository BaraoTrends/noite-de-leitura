import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { ChevronLeft, ChevronRight, Minus, Plus, BookOpen, List, Maximize2, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { useChapterById, useChaptersByNovel } from '@/hooks/useChapters';
import { useNovelById } from '@/hooks/useNovels';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useAuth } from '@/contexts/AuthContext';

const ChapterReader = () => {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState(18);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  const { chapter, loading: chapterLoading } = useChapterById(chapterId);
  const { novel, loading: novelLoading } = useNovelById(novelId);
  const { chapters, loading: chaptersLoading } = useChaptersByNovel(novelId);

  useReadingProgress(user?.id, novelId, chapterId);

  const currentIndex = useMemo(
    () => chapters.findIndex((c) => c.id === chapterId),
    [chapters, chapterId]
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const sanitizedContent = useMemo(() => {
    if (!chapter) return '';
    const formatted = chapter.content
      .replace(/\n/g, '<br/>')
      .replace(/## (.*?)$/gm, '<h2 class="font-display text-2xl mt-8 mb-4 text-foreground">$1</h2>')
      .replace(/# (.*?)$/gm, '<h1 class="font-display text-3xl mt-8 mb-4 text-foreground">$1</h1>');
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['br', 'h1', 'h2', 'p', 'strong', 'em', 'span'],
      ALLOWED_ATTR: ['class'],
    });
  }, [chapter]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  const loading = chapterLoading || novelLoading || chaptersLoading;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (!chapter || !novel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Capítulo não encontrado</h1>
          <Link to={novelId ? `/novel/${novelId}` : '/'}>
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (isImmersive) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        {/* Immersive top bar - auto-hides concept: always visible for simplicity */}
        <div className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-muted-foreground truncate">
                Cap. {chapter.chapter_order} — {chapter.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.max(14, s - 2))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.min(28, s + 2))}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsImmersive(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Immersive content */}
        <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12" style={{ fontSize: `${fontSize}px` }}>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">{chapter.title}</h1>
          <div
            className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>

        {/* Immersive bottom nav */}
        <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {prevChapter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/novel/${novelId}/capitulo/${prevChapter.id}`)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
            ) : <div />}
            <span className="text-xs text-muted-foreground">
              {chapter.chapter_order} / {chapters.length}
            </span>
            {nextChapter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/novel/${novelId}/capitulo/${nextChapter.id}`)}
                className="gap-1"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setIsImmersive(false); navigate(`/novel/${novelId}`); }}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={`${chapter.title} - ${novel.title}`}
        description={`Leia ${chapter.title} de ${novel.title}`}
        canonicalUrl={`/novel/${novelId}/capitulo/${chapterId}`}
      />

      {/* Top navigation bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link
            to={`/novel/${novelId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{novel.title}</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowChapterList(!showChapterList)}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.max(14, s - 2))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.min(28, s + 2))}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsImmersive(true)}
              title="Modo imersivo"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter list dropdown */}
      {showChapterList && (
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 max-h-64 overflow-y-auto">
            <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Capítulos</h3>
            <div className="space-y-1">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    navigate(`/novel/${novelId}/capitulo/${ch.id}`);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    ch.id === chapterId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  Cap. {ch.chapter_order} — {ch.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter header */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Capítulo {chapter.chapter_order} de {chapters.length}</span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{chapter.title}</h1>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        <article
          className="prose prose-invert prose-lg max-w-3xl mx-auto bg-card rounded-xl p-6 sm:p-8 border border-border"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div
            className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {prevChapter ? (
            <Link to={`/novel/${novelId}/capitulo/${prevChapter.id}`} className="flex-1 min-w-0">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="truncate text-left">
                  <span className="text-xs text-muted-foreground block">Anterior</span>
                  <span className="text-sm">{prevChapter.title}</span>
                </span>
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextChapter ? (
            <Link to={`/novel/${novelId}/capitulo/${nextChapter.id}`} className="flex-1 min-w-0">
              <Button variant="outline" className="w-full justify-end gap-2">
                <span className="truncate text-right">
                  <span className="text-xs text-muted-foreground block">Próximo</span>
                  <span className="text-sm">{nextChapter.title}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Button>
            </Link>
          ) : (
            <Link to={`/novel/${novelId}`} className="flex-1 min-w-0">
              <Button variant="default" className="w-full gap-2">
                <BookOpen className="w-4 h-4" />
                Voltar à Novel
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChapterReader;

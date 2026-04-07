
-- 1. Create roles enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'author', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Romance', 'romance', 1),
  ('Fantasia', 'fantasia', 2),
  ('Drama', 'drama', 3),
  ('Aventura', 'aventura', 4),
  ('Ficção Científica', 'ficcao-cientifica', 5),
  ('Suspense', 'suspense', 6),
  ('Thriller', 'thriller', 7),
  ('Mistério', 'misterio', 8),
  ('Terror', 'terror', 9),
  ('Comédia', 'comedia', 10),
  ('Ação', 'acao', 11),
  ('Histórico', 'historico', 12);

-- 4. Authors table (linked to user profiles)
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  twitter TEXT,
  instagram TEXT,
  website TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors are viewable by everyone" ON public.authors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage authors" ON public.authors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can update own profile" ON public.authors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Novels table
CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  synopsis TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author_id UUID REFERENCES public.authors(id) ON DELETE CASCADE NOT NULL,
  thumbnail_url TEXT,
  age_rating TEXT NOT NULL DEFAULT 'Livre',
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  read_time INT NOT NULL DEFAULT 0,
  youtube_video_id TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published novels are viewable by everyone" ON public.novels
  FOR SELECT USING (status = 'published' OR (auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.authors WHERE id = novels.author_id AND user_id = auth.uid())
  )));

CREATE POLICY "Admins can manage all novels" ON public.novels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can manage own novels" ON public.novels
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.authors WHERE id = novels.author_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.authors WHERE id = novels.author_id AND user_id = auth.uid()));

-- 6. Novel-Categories junction
CREATE TABLE public.novel_categories (
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (novel_id, category_id)
);

ALTER TABLE public.novel_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Novel categories viewable by everyone" ON public.novel_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage novel categories" ON public.novel_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can manage own novel categories" ON public.novel_categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.novels n
    JOIN public.authors a ON a.id = n.author_id
    WHERE n.id = novel_categories.novel_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.novels n
    JOIN public.authors a ON a.id = n.author_id
    WHERE n.id = novel_categories.novel_id AND a.user_id = auth.uid()
  ));

-- 7. Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  chapter_order INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published chapters are viewable" ON public.chapters
  FOR SELECT USING (status = 'published' OR (auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.novels n JOIN public.authors a ON a.id = n.author_id WHERE n.id = chapters.novel_id AND a.user_id = auth.uid())
  )));

CREATE POLICY "Admins can manage all chapters" ON public.chapters
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can manage own chapters" ON public.chapters
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.novels n JOIN public.authors a ON a.id = n.author_id WHERE n.id = chapters.novel_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.novels n JOIN public.authors a ON a.id = n.author_id WHERE n.id = chapters.novel_id AND a.user_id = auth.uid()));

-- 8. Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are viewable" ON public.comments
  FOR SELECT USING (is_approved = true OR (auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  )));

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all comments" ON public.comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Banners table (hero carousel)
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  novel_id UUID REFERENCES public.novels(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active banners viewable by everyone" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. SEO Settings table
CREATE TABLE public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_identifier TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  structured_data JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO settings viewable by everyone" ON public.seo_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default SEO settings
INSERT INTO public.seo_settings (page_identifier, meta_title, meta_description) VALUES
  ('home', 'NovelBrasil - Leia Novels e Romances em Português', 'NovelBrasil é sua plataforma favorita para ler novels e romances em português.'),
  ('categories', 'Categorias - NovelBrasil', 'Explore todas as categorias de novels disponíveis.'),
  ('popular', 'Novels Populares - NovelBrasil', 'As novels mais populares e bem avaliadas.'),
  ('new-releases', 'Novos Lançamentos - NovelBrasil', 'Descubra as últimas novels publicadas.'),
  ('narrated', 'Novels Narradas - NovelBrasil', 'Novels com narração em vídeo no YouTube.'),
  ('about', 'Sobre - NovelBrasil', 'Conheça mais sobre a plataforma NovelBrasil.');

-- 11. Site Settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default site settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('site_name', 'NovelBrasil', 'Nome do site'),
  ('site_description', 'Sua plataforma favorita para ler novels em português', 'Descrição do site'),
  ('site_logo', '', 'URL do logo'),
  ('footer_text', '© 2024 NovelBrasil. Todos os direitos reservados.', 'Texto do rodapé'),
  ('social_twitter', '', 'Link Twitter/X'),
  ('social_instagram', '', 'Link Instagram'),
  ('social_youtube', '', 'Link YouTube'),
  ('google_analytics_id', '', 'ID do Google Analytics'),
  ('maintenance_mode', 'false', 'Modo manutenção'),
  ('comments_require_approval', 'false', 'Comentários precisam de aprovação');

-- 12. Novel views analytics
CREATE TABLE public.novel_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.novel_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.novel_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics" ON public.novel_views
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags viewable by everyone" ON public.tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Novel-Tags junction
CREATE TABLE public.novel_tags (
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (novel_id, tag_id)
);

ALTER TABLE public.novel_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Novel tags viewable by everyone" ON public.novel_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage novel tags" ON public.novel_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, novel_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own favorites" ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 16. Reading history table
CREATE TABLE public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  progress NUMERIC(5,2) DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, novel_id)
);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.reading_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own history" ON public.reading_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_novels_author ON public.novels(author_id);
CREATE INDEX idx_novels_status ON public.novels(status);
CREATE INDEX idx_novels_published_at ON public.novels(published_at DESC);
CREATE INDEX idx_chapters_novel ON public.chapters(novel_id, chapter_order);
CREATE INDEX idx_comments_novel ON public.comments(novel_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_novel_views_novel ON public.novel_views(novel_id);
CREATE INDEX idx_novel_views_date ON public.novel_views(viewed_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_reading_history_user ON public.reading_history(user_id);

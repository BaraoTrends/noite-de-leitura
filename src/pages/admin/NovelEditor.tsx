import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIGenerateNovelDialog } from '@/components/ai/AIGenerateNovelDialog';
import { AIGenerateChaptersDialog } from '@/components/ai/AIGenerateChaptersDialog';
import { AIGenerateCoverDialog } from '@/components/ai/AIGenerateCoverDialog';
import { SeoChecker } from '@/components/admin/seo/SeoChecker';
import { SeoBriefingPanel } from '@/components/admin/seo/SeoBriefingPanel';
import { InternalLinksSuggestions } from '@/components/admin/seo/InternalLinksSuggestions';
import { AiAssistantPanel } from '@/components/admin/seo/AiAssistantPanel';
import { SeoAuditPanel } from '@/components/admin/seo/SeoAuditPanel';
import { ChapterListPanel } from '@/components/admin/ChapterListPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2 } from 'lucide-react';

const AGE_RATINGS = ['Livre', '+12', '+16', '+18'];
const STATUSES = ['draft', 'published', 'archived'];

export default function NovelEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', synopsis: '', content: '', author_id: '', thumbnail_url: '', age_rating: 'Livre', status: 'draft', is_featured: false, is_new: true, youtube_video_id: '', read_time: 0, meta_title: '', meta_description: '', meta_keywords: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [chapterRefreshKey, setChapterRefreshKey] = useState(0);
  const [recentGeneratedChapterIds, setRecentGeneratedChapterIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('authors').select('id, name').then(({ data }) => setAuthors(data || []));
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []));
    if (!isNew && id) {
      supabase.from('novels').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({ title: data.title, slug: data.slug, synopsis: data.synopsis, content: data.content, author_id: data.author_id, thumbnail_url: data.thumbnail_url || '', age_rating: data.age_rating, status: data.status, is_featured: data.is_featured, is_new: data.is_new, youtube_video_id: data.youtube_video_id || '', read_time: data.read_time, meta_title: data.meta_title || '', meta_description: data.meta_description || '', meta_keywords: data.meta_keywords || '' });
      });
      supabase.from('novel_categories').select('category_id').eq('novel_id', id).then(({ data }) => { setSelectedCategories(data?.map(d => d.category_id) || []); });
    }
  }, [id]);

  const generateSlug = (title: string) => title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const handleChange = (field: string, value: any) => { setForm(prev => { const next = { ...prev, [field]: value }; if (field === 'title' && (isNew || !prev.slug)) next.slug = generateSlug(value); return next; }); };
  const toggleCategory = (catId: string) => { setSelectedCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]); };

  const handleGenerateSeo = async () => {
    if (!form.title) { toast({ title: 'Erro', description: 'Preencha o título antes de gerar SEO.', variant: 'destructive' }); return; }
    setGeneratingSeo(true);
    try {
      const catNames = categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name).join(', ');
      const { data, error } = await supabase.functions.invoke('generate-novel-seo', {
        body: { title: form.title, synopsis: form.synopsis, categories: catNames, age_rating: form.age_rating },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setForm(prev => ({
        ...prev,
        meta_title: data.meta_title || prev.meta_title,
        meta_description: data.meta_description || prev.meta_description,
        meta_keywords: data.meta_keywords || prev.meta_keywords,
      }));
      toast({ title: 'SEO gerado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar SEO', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingSeo(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.author_id) { toast({ title: 'Error', description: 'Please fill title and author.', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const novelData = { ...form, published_at: form.status === 'published' ? new Date().toISOString() : null };
      let novelId = id;
      if (isNew) { const { data, error } = await supabase.from('novels').insert(novelData).select('id').single(); if (error) throw error; novelId = data.id; }
      else { const { error } = await supabase.from('novels').update(novelData).eq('id', id); if (error) throw error; }
      await supabase.from('novel_categories').delete().eq('novel_id', novelId!);
      if (selectedCategories.length > 0) { await supabase.from('novel_categories').insert(selectedCategories.map(catId => ({ novel_id: novelId!, category_id: catId }))); }
      toast({ title: isNew ? 'Novel created!' : 'Novel updated!' });
      navigate('/admin/novels');
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/novels')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <h1 className="font-display text-2xl text-foreground">{isNew ? 'New Novel' : 'Edit Novel'}</h1>
          <div className="ml-auto flex gap-2">
            <AIGenerateCoverDialog novelTitle={form.title} onGenerated={(url) => handleChange('thumbnail_url', url)} />
            <AIGenerateNovelDialog onGenerated={(data) => {
              setForm(prev => ({
                ...prev,
                title: data.title,
                slug: generateSlug(data.title),
                synopsis: data.synopsis,
                content: data.content,
                age_rating: data.age_rating || prev.age_rating,
                read_time: data.read_time || prev.read_time,
              }));
            }} />
            {!isNew && id && (
              <AIGenerateChaptersDialog
                novelTitle={form.title}
                novelSynopsis={form.synopsis}
                novelId={id}
                onGenerated={async (chapters) => {
                  const insertedChapterIds: string[] = [];
                  for (const ch of chapters) {
                    const { data, error } = await supabase.from('chapters').insert({
                      novel_id: id,
                      title: ch.title,
                      chapter_order: ch.chapter_order,
                      content: ch.content,
                      status: 'draft',
                    }).select('id').single();
                    if (error) throw error;
                    if (data?.id) insertedChapterIds.push(data.id);
                  }
                  setRecentGeneratedChapterIds(insertedChapterIds);
                  setChapterRefreshKey(prev => prev + 1);
                  toast({ title: 'Capítulos adicionados ao romance', description: `${insertedChapterIds.length} capítulo(s) agora aparecem na lista abaixo.` });
                }}
              />
            )}
          </div>
        </div>
        <div className="grid gap-6">
          <Card><CardHeader><CardTitle>Basic Information</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => handleChange('title', e.target.value)} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => handleChange('slug', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Author *</Label><Select value={form.author_id} onValueChange={v => handleChange('author_id', v)}><SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger><SelectContent>{authors.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => handleChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Synopsis</Label><Textarea value={form.synopsis} onChange={e => handleChange('synopsis', e.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => handleChange('content', e.target.value)} rows={10} className="font-mono text-sm" /></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Age Rating</Label><Select value={form.age_rating} onValueChange={v => handleChange('age_rating', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AGE_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Read Time (min)</Label><Input type="number" value={form.read_time} onChange={e => handleChange('read_time', parseInt(e.target.value) || 0)} /></div>
              <div className="space-y-2"><Label>YouTube Video ID</Label><Input value={form.youtube_video_id} onChange={e => handleChange('youtube_video_id', e.target.value)} placeholder="dQw4w9WgXcQ" /></div>
            </div>
            <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={e => handleChange('thumbnail_url', e.target.value)} /></div>
            <div className="space-y-2"><Label>Categories</Label><div className="flex flex-wrap gap-2">{categories.map(cat => (<button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedCategories.includes(cat.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>{cat.name}</button>))}</div></div>
            <div className="flex gap-6"><div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => handleChange('is_featured', v)} /><Label>Featured</Label></div><div className="flex items-center gap-2"><Switch checked={form.is_new} onCheckedChange={v => handleChange('is_new', v)} /><Label>New</Label></div></div>
          </CardContent></Card>

          <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Novel SEO</CardTitle><Button variant="outline" size="sm" onClick={handleGenerateSeo} disabled={generatingSeo}>{generatingSeo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar SEO com IA</>}</Button></div></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => handleChange('meta_title', e.target.value)} placeholder={form.title} /></div>
            <div className="space-y-2"><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={e => handleChange('meta_description', e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>Keywords</Label><Input value={form.meta_keywords} onChange={e => handleChange('meta_keywords', e.target.value)} placeholder="novel, romance, fantasy" /></div>
          </CardContent></Card>

          <ChapterListPanel novelId={isNew ? undefined : id} recentChapterIds={recentGeneratedChapterIds} refreshKey={chapterRefreshKey} />

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Ferramentas de SEO + IA</CardTitle></CardHeader><CardContent>
            <Tabs defaultValue="checker">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="checker">Checker</TabsTrigger>
                <TabsTrigger value="briefing">Briefing IA</TabsTrigger>
                <TabsTrigger value="assistant">Assistente</TabsTrigger>
                {!isNew && id && <TabsTrigger value="audit">Auditoria</TabsTrigger>}
                {!isNew && id && <TabsTrigger value="links">Links Internos</TabsTrigger>}
              </TabsList>
              <TabsContent value="checker" className="pt-4">
                <SeoChecker
                  title={form.title}
                  metaTitle={form.meta_title}
                  metaDescription={form.meta_description}
                  metaKeywords={form.meta_keywords}
                  synopsis={form.synopsis}
                  content={form.content}
                  thumbnail={form.thumbnail_url}
                  slug={form.slug}
                  ageRating={form.age_rating}
                  categories={categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name).join(', ')}
                  onChange={handleChange}
                />
              </TabsContent>
              <TabsContent value="briefing" className="pt-4">
                <SeoBriefingPanel title={form.title} synopsis={form.synopsis} categories={categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name).join(', ')} ageRating={form.age_rating} onApply={handleChange} />
              </TabsContent>
              <TabsContent value="assistant" className="pt-4">
                <AiAssistantPanel />
              </TabsContent>
              {!isNew && id && (
                <TabsContent value="audit" className="pt-4">
                  <SeoAuditPanel
                    novelId={id}
                    novelSlug={form.slug}
                    metaTitle={form.meta_title}
                    metaDescription={form.meta_description}
                    metaKeywords={form.meta_keywords}
                    thumbnailUrl={form.thumbnail_url}
                    onChange={handleChange}
                  />
                </TabsContent>
              )}
              {!isNew && id && (
                <TabsContent value="links" className="pt-4">
                  <InternalLinksSuggestions novelId={id} />
                </TabsContent>
              )}
            </Tabs>
          </CardContent></Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/novels')}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

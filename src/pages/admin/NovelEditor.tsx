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

  const [form, setForm] = useState({
    title: '', slug: '', synopsis: '', content: '',
    author_id: '', thumbnail_url: '', age_rating: 'Livre',
    status: 'draft', is_featured: false, is_new: true,
    youtube_video_id: '', read_time: 0,
    meta_title: '', meta_description: '', meta_keywords: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('authors').select('id, name').then(({ data }) => setAuthors(data || []));
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []));

    if (!isNew && id) {
      supabase.from('novels').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            title: data.title, slug: data.slug, synopsis: data.synopsis,
            content: data.content, author_id: data.author_id,
            thumbnail_url: data.thumbnail_url || '', age_rating: data.age_rating,
            status: data.status, is_featured: data.is_featured,
            is_new: data.is_new, youtube_video_id: data.youtube_video_id || '',
            read_time: data.read_time,
            meta_title: data.meta_title || '', meta_description: data.meta_description || '',
            meta_keywords: data.meta_keywords || '',
          });
        }
      });
      supabase.from('novel_categories').select('category_id').eq('novel_id', id).then(({ data }) => {
        setSelectedCategories(data?.map(d => d.category_id) || []);
      });
    }
  }, [id]);

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleChange = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && (isNew || !prev.slug)) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    if (!form.title || !form.author_id) {
      toast({ title: 'Erro', description: 'Preencha título e autor.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const novelData = {
        ...form,
        published_at: form.status === 'published' ? new Date().toISOString() : null,
      };

      let novelId = id;
      if (isNew) {
        const { data, error } = await supabase.from('novels').insert(novelData).select('id').single();
        if (error) throw error;
        novelId = data.id;
      } else {
        const { error } = await supabase.from('novels').update(novelData).eq('id', id);
        if (error) throw error;
      }

      // Update categories
      await supabase.from('novel_categories').delete().eq('novel_id', novelId!);
      if (selectedCategories.length > 0) {
        await supabase.from('novel_categories').insert(
          selectedCategories.map(catId => ({ novel_id: novelId!, category_id: catId }))
        );
      }

      toast({ title: isNew ? 'Novel criada!' : 'Novel atualizada!' });
      navigate('/admin/novels');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/novels')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <h1 className="font-display text-2xl text-foreground">
            {isNew ? 'Nova Novel' : 'Editar Novel'}
          </h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={e => handleChange('title', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => handleChange('slug', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Autor *</Label>
                  <Select value={form.author_id} onValueChange={v => handleChange('author_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o autor" /></SelectTrigger>
                    <SelectContent>
                      {authors.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sinopse</Label>
                <Textarea value={form.synopsis} onChange={e => handleChange('synopsis', e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea value={form.content} onChange={e => handleChange('content', e.target.value)} rows={10} className="font-mono text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Classificação Etária</Label>
                  <Select value={form.age_rating} onValueChange={v => handleChange('age_rating', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGE_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tempo de leitura (min)</Label>
                  <Input type="number" value={form.read_time} onChange={e => handleChange('read_time', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>YouTube Video ID</Label>
                  <Input value={form.youtube_video_id} onChange={e => handleChange('youtube_video_id', e.target.value)} placeholder="dQw4w9WgXcQ" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL da Thumbnail</Label>
                <Input value={form.thumbnail_url} onChange={e => handleChange('thumbnail_url', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Categorias</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={v => handleChange('is_featured', v)} />
                  <Label>Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_new} onCheckedChange={v => handleChange('is_new', v)} />
                  <Label>Novo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO da Novel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Título</Label>
                <Input value={form.meta_title} onChange={e => handleChange('meta_title', e.target.value)} placeholder={form.title} />
              </div>
              <div className="space-y-2">
                <Label>Meta Descrição</Label>
                <Textarea value={form.meta_description} onChange={e => handleChange('meta_description', e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Palavras-chave</Label>
                <Input value={form.meta_keywords} onChange={e => handleChange('meta_keywords', e.target.value)} placeholder="novel, romance, fantasia" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/novels')}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

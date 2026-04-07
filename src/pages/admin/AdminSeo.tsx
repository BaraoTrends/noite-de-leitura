import { useEffect, useState } from 'react';
import { Save, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSeo() {
  const [settings, setSettings] = useState<any[]>([]);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('seo_settings').select('*').order('page_identifier').then(({ data }) => {
      setSettings(data || []);
      const map: Record<string, any> = {};
      data?.forEach(s => { map[s.id] = { ...s }; });
      setEdited(map);
    });
  }, []);

  const handleChange = (id: string, field: string, value: string) => {
    setEdited(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (id: string) => {
    const data = edited[id];
    const { error } = await supabase.from('seo_settings').update({
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
      og_title: data.og_title,
      og_description: data.og_description,
      og_image: data.og_image,
      canonical_url: data.canonical_url,
      robots: data.robots,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'SEO atualizado!' });
    }
  };

  const pageLabels: Record<string, string> = {
    home: 'Página Inicial',
    categories: 'Categorias',
    popular: 'Populares',
    'new-releases': 'Novos',
    narrated: 'Narradas',
    about: 'Sobre',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">SEO</h1>
          <p className="text-muted-foreground mt-1">Configure meta tags e otimização para mecanismos de busca</p>
        </div>

        <Tabs defaultValue={settings[0]?.id}>
          <TabsList className="flex-wrap h-auto">
            {settings.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs">
                {pageLabels[s.page_identifier] || s.page_identifier}
              </TabsTrigger>
            ))}
          </TabsList>

          {settings.map(s => (
            <TabsContent key={s.id} value={s.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {pageLabels[s.page_identifier] || s.page_identifier}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meta Título <span className="text-xs text-muted-foreground">(&lt;60 chars)</span></Label>
                      <Input
                        value={edited[s.id]?.meta_title || ''}
                        onChange={e => handleChange(s.id, 'meta_title', e.target.value)}
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">{(edited[s.id]?.meta_title || '').length}/60</p>
                    </div>
                    <div className="space-y-2">
                      <Label>OG Título</Label>
                      <Input value={edited[s.id]?.og_title || ''} onChange={e => handleChange(s.id, 'og_title', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta Descrição <span className="text-xs text-muted-foreground">(&lt;160 chars)</span></Label>
                    <Textarea
                      value={edited[s.id]?.meta_description || ''}
                      onChange={e => handleChange(s.id, 'meta_description', e.target.value)}
                      maxLength={160}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">{(edited[s.id]?.meta_description || '').length}/160</p>
                  </div>

                  <div className="space-y-2">
                    <Label>OG Descrição</Label>
                    <Textarea value={edited[s.id]?.og_description || ''} onChange={e => handleChange(s.id, 'og_description', e.target.value)} rows={2} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Palavras-chave</Label>
                      <Input value={edited[s.id]?.meta_keywords || ''} onChange={e => handleChange(s.id, 'meta_keywords', e.target.value)} placeholder="novel, romance, leitura" />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Image URL</Label>
                      <Input value={edited[s.id]?.og_image || ''} onChange={e => handleChange(s.id, 'og_image', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL Canônica</Label>
                      <Input value={edited[s.id]?.canonical_url || ''} onChange={e => handleChange(s.id, 'canonical_url', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Robots</Label>
                      <Input value={edited[s.id]?.robots || 'index, follow'} onChange={e => handleChange(s.id, 'robots', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave(s.id)}>
                      <Save className="w-4 h-4 mr-2" />Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

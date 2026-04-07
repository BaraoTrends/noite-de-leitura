import { useEffect, useState } from 'react';
import { Save, Palette, Type, Image, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLOR_FIELDS = [
  { key: 'color_primary', label: 'Cor Primária (Gold)', description: 'Cor principal da marca, usada em botões e destaques', placeholder: '#D4A843' },
  { key: 'color_secondary', label: 'Cor Secundária (Purple)', description: 'Cor de apoio para acentos e gradientes', placeholder: '#6B21A8' },
  { key: 'color_background', label: 'Cor de Fundo', description: 'Cor de fundo principal do site', placeholder: '#0F0F14' },
  { key: 'color_card', label: 'Cor dos Cards', description: 'Cor de fundo dos cartões e painéis', placeholder: '#16161D' },
  { key: 'color_text', label: 'Cor do Texto', description: 'Cor principal do texto', placeholder: '#F5F0E8' },
  { key: 'color_accent', label: 'Cor de Destaque', description: 'Cor para elementos de destaque e hover', placeholder: '#7C3AED' },
];

const BRAND_FIELDS = [
  { key: 'brand_name', label: 'Nome da Marca', placeholder: 'Erotics Novels' },
  { key: 'brand_logo_url', label: 'URL do Logo', placeholder: 'https://exemplo.com/logo.png' },
  { key: 'brand_favicon_url', label: 'URL do Favicon', placeholder: 'https://exemplo.com/favicon.ico' },
  { key: 'brand_tagline', label: 'Slogan', placeholder: 'Sua plataforma favorita de novelas' },
];

const FONT_OPTIONS = [
  { value: 'Cinzel', label: 'Cinzel (atual)' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Lora', label: 'Lora' },
  { value: 'EB Garamond', label: 'EB Garamond' },
];

const BODY_FONT_OPTIONS = [
  { value: 'Source Sans 3', label: 'Source Sans 3 (atual)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Lato', label: 'Lato' },
];

export default function AdminVisualEdits() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allKeys = [...COLOR_FIELDS, ...BRAND_FIELDS].map(f => f.key);
      allKeys.push('font_display', 'font_body', 'custom_css', 'hero_overlay_opacity');

      for (const key of allKeys) {
        if (settings[key] !== undefined) {
          const { data: existing } = await supabase
            .from('site_settings')
            .select('id')
            .eq('key', key)
            .maybeSingle();

          if (existing) {
            await supabase.from('site_settings').update({ value: settings[key] }).eq('key', key);
          } else {
            await supabase.from('site_settings').insert({ key, value: settings[key], description: `Visual setting: ${key}` });
          }
        }
      }
      toast({ title: 'Edições visuais salvas!', description: 'As alterações visuais foram salvas com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><p className="text-muted-foreground">Carregando...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Edições Visuais</h1>
            <p className="text-muted-foreground mt-1">Personalize a aparência do site: cores, fontes, logo e mais</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>

        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="brand" className="gap-2"><Image className="w-4 h-4" />Marca</TabsTrigger>
            <TabsTrigger value="colors" className="gap-2"><Palette className="w-4 h-4" />Cores</TabsTrigger>
            <TabsTrigger value="fonts" className="gap-2"><Type className="w-4 h-4" />Fontes</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2"><Eye className="w-4 h-4" />Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Identidade da Marca</CardTitle>
                <CardDescription>Configure o nome, logo e slogan do site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {BRAND_FIELDS.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      value={settings[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                {settings['brand_logo_url'] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-2 block">Pré-visualização do logo</Label>
                    <img src={settings['brand_logo_url']} alt="Logo preview" className="max-h-16 object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Paleta de Cores</CardTitle>
                <CardDescription>Personalize as cores do tema do site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {COLOR_FIELDS.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={settings[field.key] || field.placeholder}
                          onChange={e => handleChange(field.key, e.target.value)}
                          className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <Input
                          value={settings[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Preview */}
                <div className="mt-6 p-4 rounded-lg border border-border">
                  <Label className="text-sm text-muted-foreground mb-3 block">Pré-visualização</Label>
                  <div className="flex gap-3 flex-wrap">
                    {COLOR_FIELDS.map(field => (
                      <div key={field.key} className="text-center">
                        <div
                          className="w-12 h-12 rounded-lg border border-border shadow-sm"
                          style={{ backgroundColor: settings[field.key] || field.placeholder }}
                        />
                        <span className="text-xs text-muted-foreground mt-1 block">{field.label.split('(')[0].trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fonts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tipografia</CardTitle>
                <CardDescription>Escolha as fontes para títulos e corpo do texto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Fonte de Títulos (Display)</Label>
                  <Select value={settings['font_display'] || 'Cinzel'} onValueChange={v => handleChange('font_display', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p style={{ fontFamily: settings['font_display'] || 'Cinzel' }} className="text-xl text-foreground">
                      Exemplo de Título com {settings['font_display'] || 'Cinzel'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fonte do Corpo</Label>
                  <Select value={settings['font_body'] || 'Source Sans 3'} onValueChange={v => handleChange('font_body', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BODY_FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p style={{ fontFamily: settings['font_body'] || 'Source Sans 3' }} className="text-sm text-foreground">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Ajustes finos de aparência e CSS personalizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Opacidade do Overlay do Hero (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings['hero_overlay_opacity'] || '60'}
                    onChange={e => handleChange('hero_overlay_opacity', e.target.value)}
                    placeholder="60"
                  />
                  <p className="text-xs text-muted-foreground">Controla a escurecimento sobre as imagens do carousel hero (0 = transparente, 100 = opaco)</p>
                </div>

                <div className="space-y-2">
                  <Label>CSS Personalizado</Label>
                  <Textarea
                    value={settings['custom_css'] || ''}
                    onChange={e => handleChange('custom_css', e.target.value)}
                    placeholder={`/* Estilos personalizados */\n.my-class {\n  color: red;\n}`}
                    className="font-mono text-sm min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">CSS adicional aplicado globalmente ao site. Use com cautela.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
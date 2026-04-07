import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: 0 });
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners(data || []);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditingId(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: banners.length }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditingId(b.id); setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url, link_url: b.link_url || '', is_active: b.is_active, sort_order: b.sort_order }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('banners').update(form).eq('id', editingId);
    } else {
      await supabase.from('banners').insert(form);
    }
    toast({ title: editingId ? 'Banner atualizado!' : 'Banner criado!' });
    setDialogOpen(false);
    fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    toast({ title: 'Banner removido' });
    fetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Banners</h1>
            <p className="text-muted-foreground mt-1">Gerencie o carrossel da página inicial</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Banner</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(banner => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="aspect-[16/6] bg-muted relative">
                {banner.image_url && <img src={banner.image_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="secondary" size="icon" onClick={() => openEdit(banner)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-foreground">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                <span className={`text-xs mt-1 inline-block ${banner.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {banner.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar Banner' : 'Novo Banner'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subtítulo</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div className="space-y-2"><Label>URL da Imagem</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Link (destino)</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Ativo</Label></div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

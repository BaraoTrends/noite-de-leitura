import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', is_active: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', icon: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', is_active: cat.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = { ...form, slug: form.slug || generateSlug(form.name) };
    if (editingId) {
      await supabase.from('categories').update(data).eq('id', editingId);
      toast({ title: 'Categoria atualizada!' });
    } else {
      await supabase.from('categories').insert({ ...data, sort_order: categories.length });
      toast({ title: 'Categoria criada!' });
    }
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast({ title: 'Categoria removida' });
    fetchCategories();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Categorias</h1>
            <p className="text-muted-foreground mt-1">Gerencie as categorias de novels</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">/{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${cat.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {cat.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ícone (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📚" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Ativa</Label>
              </div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

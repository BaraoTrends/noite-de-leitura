import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: 0, starts_at: null as Date | null, ends_at: null as Date | null });
  const { toast } = useToast();

  const fetchBanners = async () => { const { data } = await supabase.from('banners').select('*').order('sort_order'); setBanners(data || []); };
  useEffect(() => { fetchBanners(); }, []);

  const openNew = () => { setEditingId(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: banners.length, starts_at: null, ends_at: null }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditingId(b.id); setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url, link_url: b.link_url || '', is_active: b.is_active, sort_order: b.sort_order, starts_at: b.starts_at ? new Date(b.starts_at) : null, ends_at: b.ends_at ? new Date(b.ends_at) : null }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      image_url: form.image_url,
      link_url: form.link_url,
      is_active: form.is_active,
      sort_order: form.sort_order,
      starts_at: form.starts_at ? form.starts_at.toISOString() : null,
      ends_at: form.ends_at ? form.ends_at.toISOString() : null,
    };
    if (editingId) { await supabase.from('banners').update(payload).eq('id', editingId); }
    else { await supabase.from('banners').insert(payload); }
    toast({ title: editingId ? 'Banner updated!' : 'Banner created!' });
    setDialogOpen(false); fetchBanners();
  };

  const handleDelete = async (id: string) => { await supabase.from('banners').delete().eq('id', id); toast({ title: 'Banner removed' }); fetchBanners(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Banners</h1><p className="text-muted-foreground mt-1">Manage homepage carousel</p></div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Banner</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(banner => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="aspect-[16/6] bg-muted relative">
                {banner.image_url && <img src={banner.image_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1"><Button variant="secondary" size="icon" onClick={() => openEdit(banner)}><Edit className="w-4 h-4" /></Button><Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}><Trash2 className="w-4 h-4" /></Button></div>
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-foreground">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs ${banner.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>{banner.is_active ? 'Active' : 'Inactive'}</span>
                  {banner.starts_at && <span className="text-xs text-muted-foreground">From: {format(new Date(banner.starts_at), 'dd/MM/yyyy')}</span>}
                  {banner.ends_at && <span className="text-xs text-muted-foreground">Until: {format(new Date(banner.ends_at), 'dd/MM/yyyy')}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? 'Edit Banner' : 'New Banner'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Link (destination)</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.starts_at && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.starts_at ? format(form.starts_at, 'dd/MM/yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.starts_at || undefined} onSelect={d => setForm(f => ({ ...f, starts_at: d || null }))} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.ends_at && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.ends_at ? format(form.ends_at, 'dd/MM/yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.ends_at || undefined} onSelect={d => setForm(f => ({ ...f, ends_at: d || null }))} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
  const [banners, setBanners] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: 0 });
  const { toast } = useToast();

  const fetchBanners = async () => { const { data } = await supabase.from('banners').select('*').order('sort_order'); setBanners(data || []); };
  useEffect(() => { fetchBanners(); }, []);

  const openNew = () => { setEditingId(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: banners.length }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditingId(b.id); setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url, link_url: b.link_url || '', is_active: b.is_active, sort_order: b.sort_order }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editingId) { await supabase.from('banners').update(form).eq('id', editingId); }
    else { await supabase.from('banners').insert(form); }
    toast({ title: editingId ? 'Banner updated!' : 'Banner created!' });
    setDialogOpen(false); fetchBanners();
  };

  const handleDelete = async (id: string) => { await supabase.from('banners').delete().eq('id', id); toast({ title: 'Banner removed' }); fetchBanners(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Banners</h1><p className="text-muted-foreground mt-1">Manage homepage carousel</p></div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Banner</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(banner => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="aspect-[16/6] bg-muted relative">
                {banner.image_url && <img src={banner.image_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1"><Button variant="secondary" size="icon" onClick={() => openEdit(banner)}><Edit className="w-4 h-4" /></Button><Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}><Trash2 className="w-4 h-4" /></Button></div>
              </div>
              <CardContent className="pt-3">
                <p className="font-medium text-foreground">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                <span className={`text-xs mt-1 inline-block ${banner.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>{banner.is_active ? 'Active' : 'Inactive'}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>{editingId ? 'Edit Banner' : 'New Banner'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Link (destination)</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

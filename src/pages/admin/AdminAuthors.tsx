import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', bio: '', avatar_url: '', twitter: '', instagram: '', website: '', is_verified: false, is_active: true });
  const { toast } = useToast();

  const fetchAuthors = async () => { const { data } = await supabase.from('authors').select('*').order('name'); setAuthors(data || []); };
  useEffect(() => { fetchAuthors(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => { setEditingId(null); setForm({ name: '', slug: '', bio: '', avatar_url: '', twitter: '', instagram: '', website: '', is_verified: false, is_active: true }); setDialogOpen(true); };
  const openEdit = (a: any) => { setEditingId(a.id); setForm({ name: a.name, slug: a.slug, bio: a.bio || '', avatar_url: a.avatar_url || '', twitter: a.twitter || '', instagram: a.instagram || '', website: a.website || '', is_verified: a.is_verified, is_active: a.is_active }); setDialogOpen(true); };

  const handleSave = async () => {
    const data = { ...form, slug: form.slug || generateSlug(form.name) };
    if (editingId) { await supabase.from('authors').update(data).eq('id', editingId); toast({ title: 'Author updated!' }); }
    else { await supabase.from('authors').insert(data); toast({ title: 'Author created!' }); }
    setDialogOpen(false); fetchAuthors();
  };

  const handleDelete = async (id: string) => { await supabase.from('authors').delete().eq('id', id); toast({ title: 'Author removed' }); fetchAuthors(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Authors</h1><p className="text-muted-foreground mt-1">Manage platform authors</p></div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Author</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map(author => (
            <Card key={author.id}><CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {author.avatar_url ? <img src={author.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-display">{author.name.charAt(0)}</div>}
                  <div><div className="flex items-center gap-1"><p className="font-medium text-foreground">{author.name}</p>{author.is_verified && <CheckCircle className="w-4 h-4 text-primary" />}</div><p className="text-sm text-muted-foreground">@{author.slug}</p></div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(author)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(author.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {author.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{author.bio}</p>}
            </CardContent></Card>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit Author' : 'New Author'}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} /></div><div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div></div>
              <div className="space-y-2"><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label>Twitter</Label><Input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} /></div><div className="space-y-2"><Label>Instagram</Label><Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} /></div><div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div></div>
              <div className="flex gap-6"><div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} /><Label>Verified</Label></div><div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div></div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

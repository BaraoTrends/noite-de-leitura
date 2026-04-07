import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminNovels() {
  const [novels, setNovels] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNovels = async () => { setLoading(true); const { data, error } = await supabase.from('novels').select('*, authors(name)').order('created_at', { ascending: false }); if (!error) setNovels(data || []); setLoading(false); };
  useEffect(() => { fetchNovels(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('novels').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: 'Failed to delete novel.', variant: 'destructive' }); }
    else { toast({ title: 'Novel deleted' }); fetchNovels(); }
  };

  const filtered = novels.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));
  const statusColor: Record<string, string> = { published: 'bg-green-500/20 text-green-400', draft: 'bg-yellow-500/20 text-yellow-400', archived: 'bg-muted text-muted-foreground' };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Novels</h1><p className="text-muted-foreground mt-1">Manage all novels</p></div>
          <Link to="/admin/novels/new"><Button><Plus className="w-4 h-4 mr-2" />New Novel</Button></Link>
        </div>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search novels..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Card><CardContent className="p-0">
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No novels found.</p> : (
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Author</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Views</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rating</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr></thead><tbody>
              {filtered.map(novel => (
                <tr key={novel.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-4"><div className="flex items-center gap-3">{novel.thumbnail_url && <img src={novel.thumbnail_url} alt="" className="w-10 h-14 object-cover rounded" />}<span className="font-medium text-foreground">{novel.title}</span></div></td>
                  <td className="p-4 text-muted-foreground">{novel.authors?.name || '—'}</td>
                  <td className="p-4"><Badge className={statusColor[novel.status] || ''} variant="secondary">{novel.status}</Badge></td>
                  <td className="p-4 text-muted-foreground">{novel.views}</td>
                  <td className="p-4 text-muted-foreground">{novel.rating}</td>
                  <td className="p-4 text-right"><div className="flex items-center justify-end gap-1">
                    <Link to={`/admin/novels/${novel.id}`}><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></Link>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete novel?</AlertDialogTitle><AlertDialogDescription>This will permanently remove "{novel.title}" and all its chapters.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(novel.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent></AlertDialog>
                  </div></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </CardContent></Card>
      </div>
    </AdminLayout>
  );
}

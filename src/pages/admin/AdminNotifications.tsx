import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: '', title: '', message: '', type: 'info', link: '' });
  const { toast } = useToast();

  const fetchNotifications = async () => { const { data } = await supabase.from('notifications').select('*, profiles:user_id(full_name)').order('created_at', { ascending: false }).limit(50); setNotifications(data || []); };
  useEffect(() => { fetchNotifications(); supabase.from('profiles').select('id, full_name').then(({ data }) => setUsers(data || [])); }, []);

  const handleSend = async () => {
    if (!form.user_id || !form.title || !form.message) { toast({ title: 'Please fill all required fields.', variant: 'destructive' }); return; }
    const { error } = await supabase.from('notifications').insert(form);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Notification sent!' }); setDialogOpen(false); fetchNotifications(); }
  };

  const handleDelete = async (id: string) => { await supabase.from('notifications').delete().eq('id', id); fetchNotifications(); };

  const typeColors: Record<string, string> = { info: 'text-blue-400', success: 'text-green-400', warning: 'text-yellow-400', error: 'text-red-400' };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Notifications</h1><p className="text-muted-foreground mt-1">Send notifications to users</p></div>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />New Notification</Button>
        </div>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No notifications.</CardContent></Card>
          ) : notifications.map(n => (
            <Card key={n.id}><CardContent className="pt-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><Bell className={`w-4 h-4 ${typeColors[n.type] || ''}`} /><span className="font-medium text-foreground text-sm">{n.title}</span><span className="text-xs text-muted-foreground">→ {n.profiles?.full_name || 'User'}</span></div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}{n.is_read ? ' • Read' : ' • Unread'}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>New Notification</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>User</Label><Select onValueChange={v => setForm(f => ({ ...f, user_id: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="error">Error</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Link (optional)</Label><Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={handleSend}>Send</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

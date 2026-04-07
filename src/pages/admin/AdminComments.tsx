import { useEffect, useState } from 'react';
import { Check, X, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminComments() {
  const [comments, setComments] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const { toast } = useToast();

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, novels(title), profiles:user_id(full_name)')
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  useEffect(() => { fetchComments(); }, []);

  const updateComment = async (id: string, updates: any) => {
    await supabase.from('comments').update(updates).eq('id', id);
    toast({ title: 'Comentário atualizado' });
    fetchComments();
  };

  const deleteComment = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id);
    toast({ title: 'Comentário removido' });
    fetchComments();
  };

  const filtered = comments.filter(c => {
    if (tab === 'flagged') return c.is_flagged;
    if (tab === 'pending') return !c.is_approved;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Comentários</h1>
          <p className="text-muted-foreground mt-1">Modere os comentários dos usuários</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Todos ({comments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({comments.filter(c => !c.is_approved).length})</TabsTrigger>
            <TabsTrigger value="flagged">Denunciados ({comments.filter(c => c.is_flagged).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum comentário encontrado.</CardContent></Card>
          ) : filtered.map(comment => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {comment.profiles?.full_name || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        em {comment.novels?.title || '—'}
                      </span>
                      {comment.is_flagged && <Badge variant="destructive" className="text-xs">Denunciado</Badge>}
                      {!comment.is_approved && <Badge variant="secondary" className="text-xs">Pendente</Badge>}
                    </div>
                    <p className="text-sm text-foreground/80">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {!comment.is_approved && (
                      <Button variant="ghost" size="icon" className="text-green-500" onClick={() => updateComment(comment.id, { is_approved: true })}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {comment.is_flagged && (
                      <Button variant="ghost" size="icon" onClick={() => updateComment(comment.id, { is_flagged: false })}>
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteComment(comment.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

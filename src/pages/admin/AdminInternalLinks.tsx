import { useEffect, useState } from 'react';
import { Link2, Loader2, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminInternalLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('internal_links').select('*').order('created_at', { ascending: false }).limit(200);
    setLinks(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('internal_links').update({ status, applied_at: status === 'applied' ? new Date().toISOString() : null }).eq('id', id);
    toast({ title: 'Atualizado' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('internal_links').delete().eq('id', id);
    toast({ title: 'Removido' });
    load();
  };

  const pingSubmit = async (urls: string[]) => {
    const { error } = await supabase.functions.invoke('ping-search-engines', { body: { urls } });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'URLs enviadas para Bing/IndexNow' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Links Internos</h1><p className="text-muted-foreground mt-1">Sugestões e implementações</p></div>
          {links.length > 0 && <Button variant="outline" size="sm" onClick={() => pingSubmit(Array.from(new Set(links.map(l => `https://eroticsnovels.com${l.source_url}`))))}><Send className="w-4 h-4 mr-2" />Notificar buscadores</Button>}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" />Links ({links.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>De</TableHead><TableHead>Para</TableHead><TableHead>Âncora</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {links.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{l.source_url}</TableCell>
                      <TableCell className="text-xs">{l.target_url}</TableCell>
                      <TableCell className="text-sm font-medium">"{l.anchor_text}"</TableCell>
                      <TableCell>{l.relevance_score ? <Badge variant="secondary">{l.relevance_score}%</Badge> : '—'}</TableCell>
                      <TableCell><Badge variant={l.status === 'applied' ? 'default' : 'outline'}>{l.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {l.status !== 'applied' && <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'applied')}>Aplicar</Button>}
                          <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {links.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum link interno. Use a aba "Links Internos" no editor de novel.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

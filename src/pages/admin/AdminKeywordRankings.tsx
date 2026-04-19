import { useEffect, useState } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminKeywordRankings() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKw, setNewKw] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('keyword_rankings').select('*').order('checked_at', { ascending: false }).limit(200);
    setRankings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addKeyword = async () => {
    if (!newKw || !newUrl) { toast({ title: 'Preencha palavra-chave e URL', variant: 'destructive' }); return; }
    const { error } = await supabase.from('keyword_rankings').insert({ keyword: newKw, url: newUrl, search_engine: 'google', country: 'BR' });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Palavra-chave adicionada' }); setNewKw(''); setNewUrl(''); load(); }
  };

  const trendIcon = (cur: number | null, prev: number | null) => {
    if (!cur || !prev) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (cur < prev) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (cur > prev) return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="font-display text-3xl text-foreground">Keyword Rankings</h1><p className="text-muted-foreground mt-1">Acompanhe posições no Google ao longo do tempo</p></div>

        <Card>
          <CardHeader><CardTitle className="text-base">Adicionar palavra-chave</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="palavra-chave (ex: dark romance novel)" value={newKw} onChange={e => setNewKw(e.target.value)} className="flex-1" />
            <Input placeholder="URL (ex: /novel/slug)" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1" />
            <Button onClick={addKeyword}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" />Histórico ({rankings.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Palavra-chave</TableHead><TableHead>URL</TableHead><TableHead>Posição</TableHead><TableHead>Anterior</TableHead><TableHead>Tendência</TableHead><TableHead>Engine</TableHead><TableHead>Verificado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rankings.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.keyword}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.url}</TableCell>
                      <TableCell><Badge variant={r.position && r.position <= 10 ? 'default' : 'secondary'}>{r.position ?? '—'}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.previous_position ?? '—'}</TableCell>
                      <TableCell>{trendIcon(r.position, r.previous_position)}</TableCell>
                      <TableCell><Badge variant="outline">{r.search_engine}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.checked_at).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                  {rankings.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma palavra-chave rastreada ainda</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

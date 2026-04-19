import { useEffect, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

export default function AdminSeoAudits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('seo_audit_jobs').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setAudits(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="font-display text-3xl text-foreground">Auditorias SEO</h1><p className="text-muted-foreground mt-1">Histórico de análises geradas por IA</p></div>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />Auditorias ({audits.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>URL</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead>Problemas</TableHead><TableHead>Sugestões</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {audits.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.url}</TableCell>
                      <TableCell><Badge variant={a.score >= 80 ? 'default' : a.score >= 50 ? 'secondary' : 'destructive'}>{a.score ?? '—'}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                      <TableCell>{Array.isArray(a.issues) ? a.issues.length : 0}</TableCell>
                      <TableCell>{Array.isArray(a.suggestions) ? a.suggestions.length : 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                  {audits.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma auditoria ainda. Use a aba "Auditoria" no editor de novel.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

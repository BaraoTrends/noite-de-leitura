import { useEffect, useState } from 'react';
import { BarChart3, Eye, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAnalytics() {
  const [topNovels, setTopNovels] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { count: total } = await supabase.from('novel_views').select('id', { count: 'exact', head: true });
      setTotalViews(total || 0);

      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('novel_views')
        .select('id', { count: 'exact', head: true })
        .gte('viewed_at', today);
      setTodayViews(todayCount || 0);

      const { data: novels } = await supabase
        .from('novels')
        .select('id, title, views, rating')
        .order('views', { ascending: false })
        .limit(10);
      setTopNovels(novels || []);
    };
    fetchAnalytics();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Estatísticas detalhadas da plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-primary opacity-70" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Views</p>
                  <p className="text-2xl font-bold">{totalViews.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-500 opacity-70" />
                <div>
                  <p className="text-sm text-muted-foreground">Views Hoje</p>
                  <p className="text-2xl font-bold">{todayViews.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-accent opacity-70" />
                <div>
                  <p className="text-sm text-muted-foreground">Novels no Top 10</p>
                  <p className="text-2xl font-bold">{topNovels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Top 10 Novels por Visualizações</CardTitle></CardHeader>
          <CardContent>
            {topNovels.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {topNovels.map((novel, i) => (
                  <div key={novel.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-right">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{novel.title}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{novel.views.toLocaleString('pt-BR')}</span>
                      <span>★ {novel.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

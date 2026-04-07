import { useEffect, useState } from 'react';
import { BookOpen, Users, Eye, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface Stats { totalNovels: number; totalAuthors: number; totalViews: number; totalComments: number; totalUsers: number; recentNovels: any[]; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalNovels: 0, totalAuthors: 0, totalViews: 0, totalComments: 0, totalUsers: 0, recentNovels: [] });

  useEffect(() => {
    const fetchStats = async () => {
      const [novels, authors, comments, views, recent] = await Promise.all([
        supabase.from('novels').select('id', { count: 'exact', head: true }),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('novel_views').select('id', { count: 'exact', head: true }),
        supabase.from('novels').select('id, title, views, rating, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({ totalNovels: novels.count || 0, totalAuthors: authors.count || 0, totalComments: comments.count || 0, totalViews: views.count || 0, totalUsers: 0, recentNovels: recent.data || [] });
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Novels', value: stats.totalNovels, icon: BookOpen, color: 'text-primary' },
    { label: 'Authors', value: stats.totalAuthors, icon: Users, color: 'text-purple-accent' },
    { label: 'Views', value: stats.totalViews, icon: Eye, color: 'text-green-500' },
    { label: 'Comments', value: stats.totalComments, icon: MessageSquare, color: 'text-blue-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(stat => (
            <Card key={stat.label}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p></div><stat.icon className={`w-10 h-10 ${stat.color} opacity-70`} /></div></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="font-display">Recent Novels</CardTitle></CardHeader>
          <CardContent>
            {stats.recentNovels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No novels registered yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentNovels.map(novel => (
                  <div key={novel.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div><p className="font-medium text-foreground">{novel.title}</p><p className="text-sm text-muted-foreground">{new Date(novel.created_at).toLocaleDateString('en-US')}</p></div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Eye className="w-4 h-4" />{novel.views}</span><span className="flex items-center gap-1"><Star className="w-4 h-4" />{novel.rating}</span></div>
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

import { useEffect, useState } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(profs || []);

    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
    const rolesMap: Record<string, string[]> = {};
    rolesData?.forEach(r => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });
    setRoles(rolesMap);
  };

  useEffect(() => { fetchData(); }, []);

  const addRole = async (userId: string, role: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error?.code === '23505') {
      toast({ title: 'Usuário já possui essa role.' });
    } else if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Role "${role}" adicionada!` });
      fetchData();
    }
  };

  const removeRole = async (userId: string, role: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    toast({ title: `Role "${role}" removida` });
    fetchData();
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    moderator: 'bg-orange-500/20 text-orange-400',
    author: 'bg-purple-500/20 text-purple-400',
    user: 'bg-muted text-muted-foreground',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários e permissões</p>
        </div>

        <div className="space-y-3">
          {profiles.map(profile => (
            <Card key={profile.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-display">
                        {(profile.full_name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{profile.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{profile.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(roles[profile.id] || ['user']).map(role => (
                      <Badge
                        key={role}
                        className={`${roleColors[role] || ''} cursor-pointer`}
                        onClick={() => role !== 'user' && removeRole(profile.id, role)}
                      >
                        {role} {role !== 'user' && '×'}
                      </Badge>
                    ))}
                    <Select onValueChange={v => addRole(profile.id, v)}>
                      <SelectTrigger className="w-auto h-8 text-xs">
                        <UserPlus className="w-3 h-3 mr-1" />
                        <span>Adicionar</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="author">Autor</SelectItem>
                      </SelectContent>
                    </Select>
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

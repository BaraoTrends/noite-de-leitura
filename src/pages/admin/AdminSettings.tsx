import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { supabase.from('site_settings').select('key, value').then(({ data }) => { const map: Record<string, string> = {}; data?.forEach(s => { map[s.key] = s.value || ''; }); setSettings(map); setLoading(false); }); }, []);

  const handleChange = (key: string, value: string) => { setSettings(prev => ({ ...prev, [key]: value })); };

  const handleSave = async () => {
    const updates = Object.entries(settings).map(([key, value]) => supabase.from('site_settings').update({ value }).eq('key', key));
    await Promise.all(updates);
    toast({ title: 'Settings saved!' });
  };

  const groups = [
    { title: 'General', fields: [{ key: 'site_name', label: 'Site Name' }, { key: 'site_description', label: 'Description' }, { key: 'site_logo', label: 'Logo URL' }, { key: 'footer_text', label: 'Footer Text' }] },
    { title: 'Social Media', fields: [{ key: 'social_twitter', label: 'Twitter/X' }, { key: 'social_instagram', label: 'Instagram' }, { key: 'social_youtube', label: 'YouTube' }] },
    { title: 'Integrations', fields: [{ key: 'google_analytics_id', label: 'Google Analytics ID' }] },
    { title: 'System', fields: [{ key: 'maintenance_mode', label: 'Maintenance Mode (true/false)' }, { key: 'comments_require_approval', label: 'Comments require approval (true/false)' }] },
  ];

  if (loading) return <AdminLayout><p className="text-muted-foreground">Loading...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl text-foreground">Settings</h1><p className="text-muted-foreground mt-1">General site settings</p></div>
          <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save All</Button>
        </div>
        {groups.map(group => (
          <Card key={group.title}><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent className="space-y-4">
            {group.fields.map(field => (<div key={field.key} className="space-y-2"><Label>{field.label}</Label><Input value={settings[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)} /></div>))}
          </CardContent></Card>
        ))}
      </div>
    </AdminLayout>
  );
}

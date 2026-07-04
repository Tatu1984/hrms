'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, UserCog } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  plan: string;
  subscriptionStatus: string | null;
  createdAt: string;
  _count: { users: number; employees: number };
}

export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/organizations');
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setOrgs(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (org: Org) => {
    const res = await fetch(`/api/superadmin/organizations/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !org.isActive }),
    });
    if (res.ok) load();
    else alert((await res.json()).error || 'Failed to update');
  };

  const resetAdmin = async (org: Org) => {
    if (!confirm(`Reset the admin password for ${org.name}? A new temporary password will be shown once.`)) return;
    const res = await fetch(`/api/superadmin/organizations/${org.id}/reset-admin`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      alert(
        `Admin password reset for ${org.name}.\n\n` +
        `User: ${data.email}\nTemporary password:\n\n    ${data.tempPassword}\n\n` +
        `Share this securely — shown once. They must change it on next login.`
      );
    } else {
      alert(data.error || 'Failed to reset admin password');
    }
  };

  const createOrg = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/superadmin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setForm({ companyName: '', name: '', email: '', password: '' });
        load();
      } else {
        alert(data.error || 'Failed to create organization');
      }
    } finally {
      setCreating(false);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">You do not have access to the platform console.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7" />
            Platform Console
          </h1>
          <p className="text-muted-foreground">Manage all tenant organizations</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" />
          New Organization
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Provision a new tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Admin name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Admin email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Temp password (min 8)</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={createOrg} disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organizations {!loading && `(${orgs.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading…</div>
          ) : orgs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No organizations yet.</div>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{org.name}</span>
                      <Badge variant={org.isActive ? 'default' : 'secondary'}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{org.plan}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                      <span>/{org.slug}</span>
                      <span className="flex items-center gap-1"><UserCog className="w-3.5 h-3.5" />{org._count.users} users</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{org._count.employees} employees</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => resetAdmin(org)}>
                      Reset admin
                    </Button>
                    <Button variant={org.isActive ? 'outline' : 'default'} size="sm" onClick={() => toggleActive(org)}>
                      {org.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

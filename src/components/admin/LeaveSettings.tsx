'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

type LeaveType = 'SICK' | 'CASUAL' | 'EARNED';

const LEAVE_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'EARNED'];

interface Policy {
  leaveType: LeaveType;
  annualQuota: number;
}

interface Balance {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
}

export function LeaveSettings() {
  return (
    <div className="space-y-6">
      <LeavePolicySection />
      <EmployeeBalancesSection />
    </div>
  );
}

function LeavePolicySection() {
  const [policies, setPolicies] = useState<Record<LeaveType, string>>({
    SICK: '',
    CASUAL: '',
    EARNED: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/leave-policy');
        if (!res.ok) throw new Error('Failed to load policy');
        const data = await res.json();
        if (!active) return;
        const next: Record<LeaveType, string> = { SICK: '', CASUAL: '', EARNED: '' };
        for (const p of (data.policies ?? []) as Policy[]) {
          if (LEAVE_TYPES.includes(p.leaveType)) {
            next[p.leaveType] = String(p.annualQuota ?? '');
          }
        }
        setPolicies(next);
      } catch {
        if (active) toast.error('Could not load leave policy');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        policies: LEAVE_TYPES.map((leaveType) => ({
          leaveType,
          annualQuota: Number(policies[leaveType]) || 0,
        })),
      };
      const res = await fetch('/api/leave-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Leave policy saved');
    } catch {
      toast.error('Could not save leave policy');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Policy</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set the default annual quota for each leave type.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {LEAVE_TYPES.map((type) => (
                <div key={type} className="space-y-2">
                  <Label htmlFor={`policy-${type}`}>{type}</Label>
                  <Input
                    id={`policy-${type}`}
                    type="number"
                    min={0}
                    value={policies[type]}
                    onChange={(e) =>
                      setPolicies((prev) => ({ ...prev, [type]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Policy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmployeeBalancesSection() {
  const currentYear = new Date().getFullYear();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [year, setYear] = useState<number>(currentYear);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [allocations, setAllocations] = useState<Record<LeaveType, string>>({
    SICK: '',
    CASUAL: '',
    EARNED: '',
  });
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [savingType, setSavingType] = useState<LeaveType | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to load employees');
        const data = await res.json();
        const list: Employee[] = Array.isArray(data) ? data : (data.employees ?? []);
        if (!active) return;
        setEmployees(list);
        if (list.length > 0) setEmployeeId(list[0].id);
      } catch {
        if (active) toast.error('Could not load employees');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadBalances = useCallback(async () => {
    if (!employeeId) return;
    setLoadingBalances(true);
    try {
      const res = await fetch(
        `/api/leave-balances?employeeId=${encodeURIComponent(employeeId)}&year=${year}`
      );
      if (!res.ok) throw new Error('Failed to load balances');
      const data = await res.json();
      const list: Balance[] = data.balances ?? [];
      setBalances(list);
      const next: Record<LeaveType, string> = { SICK: '', CASUAL: '', EARNED: '' };
      for (const b of list) {
        if (LEAVE_TYPES.includes(b.leaveType)) next[b.leaveType] = String(b.allocated ?? '');
      }
      setAllocations(next);
    } catch {
      toast.error('Could not load balances');
    } finally {
      setLoadingBalances(false);
    }
  }, [employeeId, year]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  async function handleSave(leaveType: LeaveType) {
    if (!employeeId) return;
    setSavingType(leaveType);
    try {
      const res = await fetch('/api/leave-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          year,
          leaveType,
          allocated: Number(allocations[leaveType]) || 0,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(`${leaveType} allocation saved`);
      await loadBalances();
    } catch {
      toast.error('Could not save allocation');
    } finally {
      setSavingType(null);
    }
  }

  const byType = (type: LeaveType) => balances.find((b) => b.leaveType === type);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Balances</CardTitle>
        <p className="text-sm text-muted-foreground">
          Adjust allocated leave for a specific employee and year.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingBalances ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading balances…
          </div>
        ) : !employeeId ? (
          <p className="text-sm text-muted-foreground">Select an employee to view balances.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Leave Type</th>
                  <th className="py-2 pr-4 font-medium">Used</th>
                  <th className="py-2 pr-4 font-medium">Remaining</th>
                  <th className="py-2 pr-4 font-medium">Allocated</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {LEAVE_TYPES.map((type) => {
                  const b = byType(type);
                  return (
                    <tr key={type} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium">{type}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{b?.used ?? 0}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{b?.remaining ?? 0}</td>
                      <td className="py-3 pr-4">
                        <Input
                          type="number"
                          min={0}
                          className="w-28"
                          value={allocations[type]}
                          onChange={(e) =>
                            setAllocations((prev) => ({ ...prev, [type]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSave(type)}
                          disabled={savingType === type}
                        >
                          {savingType === type ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

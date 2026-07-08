'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  salary: number;
  department: string;
}

interface PayrollDialogProps {
  employees: Employee[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ALL = 'ALL';

export function PayrollDialog({ employees }: PayrollDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [target, setTarget] = useState<string>(ALL);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [overwrite, setOverwrite] = useState(false);

  // Payroll is computed from attendance + salary config on the server. The UI
  // only chooses WHO and WHICH month — it never sends salary numbers.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          // Empty array => every employee in the org.
          employeeIds: target === ALL ? [] : [target],
          overwrite,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate payroll');
      }

      setResult({ ok: true, message: data.message || 'Payroll generated.' });
      router.refresh();
    } catch (error: any) {
      setResult({ ok: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-600">
          <Calculator className="w-4 h-4 mr-2" />
          Generate Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            Salary is calculated automatically from attendance and your salary
            settings (PF/ESI/PT/TDS). Choose who and which month.
          </p>

          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.employeeId} - {emp.name} ({emp.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || year)}
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(v) => setOverwrite(v === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="overwrite" className="cursor-pointer">
                Regenerate if payroll already exists
              </Label>
              <p className="text-xs text-gray-500">
                Recomputes from current attendance. Manual penalties/advances are
                kept; records already marked <strong>Paid</strong> are never touched.
              </p>
            </div>
          </div>

          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.ok
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Payroll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

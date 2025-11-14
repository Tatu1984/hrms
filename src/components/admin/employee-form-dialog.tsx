'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Employee {
  id?: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  address: string;
  designation: string;
  salary: number;
  department: string;
  reportingHeadId?: string;
  dateOfJoining: string;
}

interface EmployeeFormDialogProps {
  employee?: Employee;
  employees?: Employee[];
  mode?: 'create' | 'edit';
}

export default function EmployeeFormDialog({ employee, employees = [], mode = 'create' }: EmployeeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Employee>(
    employee || {
      name: '',
      email: '',
      phone: '',
      altPhone: '',
      address: '',
      designation: '',
      salary: 0,
      department: '',
      reportingHeadId: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'edit' ? `/api/employees/${employee?.id}` : '/api/employees';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save employee');
      }

      setOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        ) : (
          <Button variant="outline" size="sm">Edit</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Employee' : 'Edit Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altPhone">Alternate Phone</Label>
              <Input
                id="altPhone"
                value={formData.altPhone}
                onChange={(e) => handleChange('altPhone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Select value={formData.designation} onValueChange={(val) => handleChange('designation', val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Developer Salary Structure */}
                  <SelectItem value="HR Exec">HR Exec</SelectItem>
                  <SelectItem value="HR Manager">HR Manager</SelectItem>
                  <SelectItem value="VP HR">VP HR</SelectItem>
                  <SelectItem value="Director HR">Director HR</SelectItem>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="CFO">CFO</SelectItem>
                  <SelectItem value="COO">COO</SelectItem>
                  <SelectItem value="CTO">CTO</SelectItem>
                  <SelectItem value="Jr Developer">Jr Developer</SelectItem>
                  <SelectItem value="Sr Developer">Sr Developer</SelectItem>
                  <SelectItem value="CDO">CDO</SelectItem>
                  <SelectItem value="Sr Designer">Sr Designer</SelectItem>
                  <SelectItem value="Jr Designer">Jr Designer</SelectItem>
                  <SelectItem value="House Keeping">House Keeping</SelectItem>
                  <SelectItem value="CSO">CSO</SelectItem>
                  <SelectItem value="VP Sales">VP Sales</SelectItem>
                  <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                  <SelectItem value="Assistant Ops Manager">Assistant Ops Manager</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  {/* Sales Salary Structure */}
                  <SelectItem value="CSR">CSR</SelectItem>
                  <SelectItem value="Sr CSR">Sr CSR</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(val) => handleChange('department', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salary *</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleChange('salary', parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining *</Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportingHead">Reporting Head (Optional)</Label>
            <Select value={formData.reportingHeadId || undefined} onValueChange={(val) => handleChange('reportingHeadId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reporting head (optional)" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id!}>
                    {emp.name} - {emp.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Add Employee' : 'Update Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
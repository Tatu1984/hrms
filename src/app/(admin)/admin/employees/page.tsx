// ============================================
// FILE: src/app/(admin)/admin/employees/page.tsx
// ============================================
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Trash2, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import EmployeeFormDialog from '@/components/admin/employee-form-dialog';
import DeleteEmployeeButton from '@/components/admin/delete-employee-button';
import ToggleEmployeeActiveButton from '@/components/admin/toggle-employee-active-button';
import { UserCredentialsDialog } from '@/components/forms/user-credentials-dialog';
import Link from 'next/link';

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: {
      reportingHead: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          permissions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600">Manage all employee records</p>
        </div>
        <EmployeeFormDialog employees={employees} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee List ({employees.length} total)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Login Access</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">View</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-sm">{emp.name}</td>
                    <td className="px-4 py-3 text-sm">{emp.email}</td>
                    <td className="px-4 py-3 text-sm">{emp.phone}</td>
                    <td className="px-4 py-3 text-sm">{emp.designation}</td>
                    <td className="px-4 py-3 text-sm">{emp.department}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(emp.salary)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={emp.isActive ? 'default' : 'secondary'} className={emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {emp.user ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700">
                              {emp.user.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">@{emp.user.username}</div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">No Access</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/admin/employees/${emp.id}`}>
                        <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <EmployeeFormDialog employee={emp} employees={employees} mode="edit" />
                        <UserCredentialsDialog
                          employee={{
                            id: emp.id,
                            employeeId: emp.employeeId,
                            name: emp.name,
                            email: emp.email,
                          }}
                          existingUser={emp.user}
                        />
                        <ToggleEmployeeActiveButton
                          employeeId={emp.id}
                          employeeName={emp.name}
                          isActive={emp.isActive}
                        />
                        <DeleteEmployeeButton employeeId={emp.id} employeeName={emp.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
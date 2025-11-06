import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { AttendanceCalendarView } from '@/components/attendance/AttendanceCalendarView';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      reportingHead: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  // Get current month's attendance for this employee
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Format attendance for calendar
  const calendarData = attendance.map(att => ({
    date: att.date,
    status: att.status,
    totalHours: att.totalHours,
    breakDuration: att.breakDuration,
    idleTime: att.idleTime,
  }));

  // Calculate statistics
  const totalPresent = attendance.filter(a => a.status === 'PRESENT').length;
  const totalHalfDay = attendance.filter(a => a.status === 'HALF_DAY').length;
  const totalAbsent = attendance.filter(a => a.status === 'ABSENT').length;
  const totalLeave = attendance.filter(a => a.status === 'LEAVE').length;
  const totalWorkHours = attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  const totalBreakHours = attendance.reduce((sum, a) => sum + (a.breakDuration || 0), 0);
  const totalIdleHours = attendance.reduce((sum, a) => sum + (a.idleTime || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Employee ID</div>
                <div className="font-semibold">{employee.employeeId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-semibold text-lg">{employee.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Designation</div>
                <div className="font-medium">{employee.designation}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Department</div>
                <div>{employee.department}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-sm">{employee.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-sm">{employee.phone}</div>
              </div>
              {employee.altPhone && (
                <div>
                  <div className="text-sm text-gray-500">Alternate Phone</div>
                  <div className="text-sm">{employee.altPhone}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Address</div>
                <div className="text-sm">{employee.address}</div>
              </div>
              {employee.reportingHead && (
                <div>
                  <div className="text-sm text-gray-500">Reporting To</div>
                  <div className="text-sm">{employee.reportingHead.name}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Date of Joining</div>
                <div className="text-sm">{formatDate(employee.dateOfJoining.toString())}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Salary (CTC)</div>
                <div className="font-semibold">₹{employee.salary.toLocaleString('en-IN')}</div>
              </div>
              {employee.employeeType && (
                <div>
                  <div className="text-sm text-gray-500">Employee Type</div>
                  <div className="text-sm">{employee.employeeType}</div>
                </div>
              )}
              {employee.salesTarget && (
                <div>
                  <div className="text-sm text-gray-500">Sales Target</div>
                  <div className="text-sm">₹{employee.salesTarget.toLocaleString('en-IN')}</div>
                </div>
              )}
              {employee.user && (
                <div>
                  <div className="text-sm text-gray-500">System Access</div>
                  <Badge className="mt-1">{employee.user.role}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* KYC Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Aadhar Number</div>
                <div className="font-medium">{employee.aadharNumber || 'Not provided'}</div>
                {employee.aadharDocument && (
                  <a
                    href={employee.aadharDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    View Aadhar Document →
                  </a>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">PAN Number</div>
                <div className="font-medium">{employee.panNumber || 'Not provided'}</div>
                {employee.panDocument && (
                  <a
                    href={employee.panDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    View PAN Document →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Bank Name</div>
                <div className="font-medium">{employee.bankName || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bank Branch Address</div>
                <div className="text-sm">{employee.bankAddress || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Account Number</div>
                <div className="font-medium">{employee.accountNumber || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">IFSC Code</div>
                <div className="font-medium">{employee.ifscCode || 'Not provided'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Statistics (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{totalHalfDay}</div>
                <div className="text-sm text-gray-600">Half Day</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalLeave}</div>
                <div className="text-sm text-gray-600">On Leave</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalWorkHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Total Work Hours</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{totalBreakHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Total Break</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{totalIdleHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Total Idle Time</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {totalWorkHours > 0 ? ((totalWorkHours / (totalPresent + totalHalfDay)) || 0).toFixed(1) : 0}h
                </div>
                <div className="text-sm text-gray-600">Avg Work/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AttendanceCalendarView attendanceData={calendarData} showEmployeeCount={false} />

      <Card>
        <CardHeader>
          <CardTitle>Detailed Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Punch In</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Punch Out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Work Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Break</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Idle Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{formatDate(att.date.toString())}</td>
                    <td className="px-4 py-3 text-sm">
                      {att.punchIn ? new Date(att.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {att.punchOut ? new Date(att.punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                      {att.totalHours ? `${att.totalHours}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-600">
                      {att.breakDuration ? `${att.breakDuration}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-pink-600">
                      {att.idleTime ? `${att.idleTime}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={
                        att.status === 'PRESENT' ? 'default' :
                        att.status === 'HALF_DAY' ? 'secondary' :
                        att.status === 'LEAVE' ? 'outline' :
                        'destructive'
                      }>
                        {att.status}
                      </Badge>
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

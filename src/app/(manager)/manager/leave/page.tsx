import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { LeaveActionButtons } from '@/components/admin/LeaveActionButtons';

export default async function ManagerLeavePage() {
  const session = await getSession();

  const teamMembers = await prisma.employee.findMany({
    where: {
      reportingHeadId: session!.employeeId!,
    },
  });

  const teamIds = [session!.employeeId!, ...teamMembers.map(t => t.id)];

  const leaves = await prisma.leave.findMany({
    where: {
      employeeId: {
        in: teamIds,
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Leave Requests</h1>
        <p className="text-gray-600">Approve or reject leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Leave Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves.map((leave) => {
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{leave.employee?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{leave.leaveType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(leave.startDate)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(leave.endDate)}</td>
                      <td className="px-4 py-3 text-sm">{leave.days}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge 
                          variant={
                            leave.status === 'APPROVED' ? 'default' : 
                            leave.status === 'REJECTED' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <LeaveActionButtons leaveId={leave.id} currentStatus={leave.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
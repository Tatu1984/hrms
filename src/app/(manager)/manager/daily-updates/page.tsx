import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function ManagerDailyUpdatesPage() {
  const session = await getSession();

  if (!session || session.role !== 'MANAGER' || !session.employeeId) {
    redirect('/login');
  }

  // Fetch team members (subordinates) who are developers
  const teamMembers = await prisma.employee.findMany({
    where: {
      reportingHeadId: session.employeeId,
      OR: [
        { designation: { contains: 'Developer', mode: 'insensitive' } },
        { designation: { contains: 'Engineer', mode: 'insensitive' } },
        { designation: { contains: 'Programmer', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      employeeId: true,
      name: true,
      designation: true,
      department: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get recent updates (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const teamMemberIds = teamMembers.map(tm => tm.id);

  const recentUpdates = await prisma.dailyWorkUpdate.findMany({
    where: {
      employeeId: {
        in: teamMemberIds,
      },
      date: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Map updates by employee
  const updatesByEmployee = new Map<string, typeof recentUpdates>();
  recentUpdates.forEach(update => {
    if (!updatesByEmployee.has(update.employeeId)) {
      updatesByEmployee.set(update.employeeId, []);
    }
    updatesByEmployee.get(update.employeeId)!.push(update);
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Daily Updates</h1>
        <p className="text-gray-500 mt-1">View daily work progress from your team members</p>
      </div>

      <div className="grid gap-6">
        {teamMembers.map(member => {
          const memberUpdates = updatesByEmployee.get(member.id) || [];
          const lastUpdate = memberUpdates[0];

          return (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{member.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{member.designation}</Badge>
                      <span className="text-sm text-gray-500">{member.employeeId}</span>
                    </div>
                  </div>
                  <Badge variant={memberUpdates.length > 0 ? 'default' : 'secondary'}>
                    {memberUpdates.length} updates (30 days)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lastUpdate ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-700">Latest Update</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(lastUpdate.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Work Completed:</p>
                        <p className="text-sm text-gray-600">{lastUpdate.workCompleted}</p>
                      </div>
                      {lastUpdate.obstaclesOvercome && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Obstacles Overcome:</p>
                          <p className="text-sm text-gray-600">{lastUpdate.obstaclesOvercome}</p>
                        </div>
                      )}
                      {lastUpdate.tasksLeft && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Tasks Left:</p>
                          <p className="text-sm text-gray-600">{lastUpdate.tasksLeft}</p>
                        </div>
                      )}
                    </div>
                    {memberUpdates.length > 1 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                          View all {memberUpdates.length} updates
                        </summary>
                        <div className="mt-4 space-y-4">
                          {memberUpdates.slice(1).map(update => (
                            <div key={update.id} className="border-l-2 border-gray-200 pl-4">
                              <p className="text-sm text-gray-500 mb-2">
                                {format(new Date(update.date), 'MMM dd, yyyy')}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-700">Work Completed:</p>
                                  <p className="text-xs text-gray-600">{update.workCompleted}</p>
                                </div>
                                {update.obstaclesOvercome && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Obstacles:</p>
                                    <p className="text-xs text-gray-600">{update.obstaclesOvercome}</p>
                                  </div>
                                )}
                                {update.tasksLeft && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Tasks Left:</p>
                                    <p className="text-xs text-gray-600">{update.tasksLeft}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent updates from this team member</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No developers found in your team</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

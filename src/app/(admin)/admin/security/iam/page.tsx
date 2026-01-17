import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Key, Settings } from 'lucide-react';
import { UsersTab } from '@/components/iam/UsersTab';
import { RolesTab } from '@/components/iam/RolesTab';
import { PermissionsTab } from '@/components/iam/PermissionsTab';
import { SeedButton } from '@/components/iam/SeedButton';

export default async function IAMPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN') {
    redirect('/employee/dashboard');
  }

  // Fetch all data needed
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        employee: {
          select: {
            name: true,
            department: true,
            designation: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.iAMRole.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            Identity & Access Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and permissions across your organization
          </p>
        </div>
        <SeedButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Total Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{roles.length}</p>
            <p className="text-sm text-gray-500">
              {roles.filter(r => r.isSystem).length} system, {roles.filter(r => !r.isSystem).length} custom
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-600" />
              Role Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {roles.reduce((acc, r) => acc + r.users.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View users and manage their role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTab users={users} roles={roles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Create and manage custom roles with specific permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesTab roles={roles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                View permissions for each role across all modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsTab roles={roles} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

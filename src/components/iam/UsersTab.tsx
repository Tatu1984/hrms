'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, UserPlus, Shield, X } from 'lucide-react';
import { AssignRoleDialog } from './AssignRoleDialog';
import { getRoleColor } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  employee: {
    name: string;
    department: string;
    designation: string;
  } | null;
  userRoles: {
    id: string;
    role: {
      id: string;
      name: string;
      displayName: string;
      color: string | null;
    };
  }[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  color: string | null;
}

interface UsersTabProps {
  users: User[];
  roles: Role[];
}

export function UsersTab({ users, roles }: UsersTabProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.employee?.name.toLowerCase().includes(searchLower) ||
      user.employee?.department?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setIsAssignDialogOpen(true);
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) return;

    try {
      const response = await fetch(`/api/iam/users/${userId}/roles?roleId=${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove role');
      }
    } catch {
      alert('Failed to remove role');
    }
  };

  const getSystemRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      MANAGER: 'bg-orange-100 text-orange-700',
      EMPLOYEE: 'bg-blue-100 text-blue-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Additional Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.employee?.name || user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{user.employee?.designation || '-'}</p>
                    <p className="text-xs text-gray-500">{user.employee?.department || '-'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getSystemRoleBadge(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.userRoles.length > 0 ? (
                      user.userRoles.map((ur) => (
                        <Badge
                          key={ur.id}
                          variant="outline"
                          className={`${getRoleColor(ur.role.name)} flex items-center gap-1`}
                        >
                          {ur.role.displayName}
                          <button
                            onClick={() => handleRemoveRole(user.id, ur.role.id)}
                            className="ml-1 hover:bg-black/10 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No additional roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAssignRole(user)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        View Permissions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AssignRoleDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        user={selectedUser}
        roles={roles}
      />
    </div>
  );
}

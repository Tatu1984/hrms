'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Lock } from 'lucide-react';
import { CreateRoleDialog } from './CreateRoleDialog';
import { getRoleColor } from '@/lib/permissions';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: unknown; // JsonValue from Prisma
  color: string | null;
  users: {
    id: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  }[];
}

interface RolesTabProps {
  roles: Role[];
}

export function RolesTab({ roles }: RolesTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/iam/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete role');
      }
    } catch {
      alert('Failed to delete role');
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingRole(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(role.name)}>
                      {role.displayName}
                    </Badge>
                    {role.isSystem && (
                      <span title="System role">
                        <Lock className="w-3 h-3 text-gray-400" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {role.description || '-'}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                    {role.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{role.users.length}</span>
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
                      <DropdownMenuItem onClick={() => handleEdit(role)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      {!role.isSystem && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Role
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No roles found. Click &quot;Create Role&quot; to add one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateRoleDialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogClose}
        editingRole={editingRole}
      />
    </div>
  );
}

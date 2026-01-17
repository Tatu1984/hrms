'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { getRoleColor } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  email: string;
  employee: {
    name: string;
  } | null;
  userRoles: {
    id: string;
    role: {
      id: string;
      name: string;
      displayName: string;
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

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roles: Role[];
}

export function AssignRoleDialog({ open, onOpenChange, user, roles }: AssignRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const assignedRoleIds = user.userRoles.map(ur => ur.role.id);
  const availableRoles = roles.filter(r => !assignedRoleIds.includes(r.id));

  const handleAssign = async () => {
    if (!selectedRoleId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/iam/users/${user.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      if (response.ok) {
        onOpenChange(false);
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to assign role');
      }
    } catch {
      alert('Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Assign an additional role to {user.employee?.name || user.username}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {user.userRoles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Current roles:</p>
              <div className="flex flex-wrap gap-2">
                {user.userRoles.map(ur => (
                  <Badge key={ur.id} className={getRoleColor(ur.role.name)}>
                    {ur.role.displayName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Select a role to assign:</p>
            {availableRoles.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedRoleId === role.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(role.name)}>
                        {role.displayName}
                      </Badge>
                      {role.isSystem && (
                        <span className="text-xs text-gray-400">(System)</span>
                      )}
                    </div>
                    {selectedRoleId === role.id && (
                      <Check className="w-5 h-5 text-orange-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">
                User already has all available roles
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={saving || !selectedRoleId}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

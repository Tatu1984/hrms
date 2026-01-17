'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MODULES, getPermissionsByModule, type PermissionCode } from '@/lib/permissions';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: unknown; // JsonValue from Prisma
  color: string | null;
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole?: Role | null;
}

const COLORS = [
  { name: 'red', class: 'bg-red-100 text-red-700' },
  { name: 'orange', class: 'bg-orange-100 text-orange-700' },
  { name: 'yellow', class: 'bg-yellow-100 text-yellow-700' },
  { name: 'green', class: 'bg-green-100 text-green-700' },
  { name: 'blue', class: 'bg-blue-100 text-blue-700' },
  { name: 'purple', class: 'bg-purple-100 text-purple-700' },
  { name: 'pink', class: 'bg-pink-100 text-pink-700' },
  { name: 'cyan', class: 'bg-cyan-100 text-cyan-700' },
];

export function CreateRoleDialog({ open, onOpenChange, editingRole }: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const permissionsByModule = getPermissionsByModule();

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name);
      setDisplayName(editingRole.displayName);
      setDescription(editingRole.description || '');
      setSelectedPermissions(Array.isArray(editingRole.permissions) ? editingRole.permissions : []);
      setSelectedColor(editingRole.color || 'blue');
    } else {
      setName('');
      setDisplayName('');
      setDescription('');
      setSelectedPermissions([]);
      setSelectedColor('blue');
    }
  }, [editingRole, open]);

  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleKey)
        ? prev.filter(m => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionCode)
        ? prev.filter(p => p !== permissionCode)
        : [...prev, permissionCode]
    );
  };

  const toggleAllInModule = (moduleKey: string, permissions: { code: PermissionCode }[]) => {
    const moduleCodes = permissions.map(p => p.code);
    const allSelected = moduleCodes.every(code => selectedPermissions.includes(code));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !moduleCodes.includes(p as PermissionCode)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...moduleCodes])]);
    }
  };

  const handleSave = async () => {
    if (!displayName) {
      alert('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const url = editingRole
        ? `/api/iam/roles/${editingRole.id}`
        : '/api/iam/roles';

      const response = await fetch(url, {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRole ? undefined : displayName,
          displayName,
          description,
          permissions: selectedPermissions,
          color: selectedColor,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save role');
      }
    } catch {
      alert('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {editingRole
              ? 'Update the role details and permissions'
              : 'Create a new custom role with specific permissions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Role Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., HR Manager"
                disabled={editingRole?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                      selectedColor === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selectedPermissions.length} selected)</Label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {Object.entries(MODULES).map(([moduleKey, moduleLabel]) => {
                const permissions = permissionsByModule[moduleKey] || [];
                const isExpanded = expandedModules.includes(moduleKey);
                const selectedCount = permissions.filter(p =>
                  selectedPermissions.includes(p.code)
                ).length;

                return (
                  <div key={moduleKey} className="border-b last:border-b-0">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleModule(moduleKey)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{moduleLabel}</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedCount}/{permissions.length}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllInModule(moduleKey, permissions);
                        }}
                      >
                        {selectedCount === permissions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 bg-gray-50">
                        {permissions.map((permission) => (
                          <label
                            key={permission.code}
                            className="flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedPermissions.includes(permission.code)}
                              onCheckedChange={() => togglePermission(permission.code)}
                            />
                            <div>
                              <p className="text-sm font-medium">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !displayName}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

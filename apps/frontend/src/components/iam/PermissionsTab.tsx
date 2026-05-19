'use client';

import { useState, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { MODULES, getPermissionsByModule } from '@/lib/permissions';

interface Role {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  permissions: unknown; // JsonValue from Prisma
  color: string | null;
}

interface PermissionsTabProps {
  roles: Role[];
}

export function PermissionsTab({ roles }: PermissionsTabProps) {
  const [selectedModule, setSelectedModule] = useState<string | 'all'>('all');
  const permissionsByModule = getPermissionsByModule();

  const modules = Object.entries(MODULES);
  const filteredModules = selectedModule === 'all'
    ? modules
    : modules.filter(([key]) => key === selectedModule);

  const hasPermission = (role: Role, permissionCode: string) => {
    if (!Array.isArray(role.permissions)) return false;
    return (role.permissions as string[]).includes(permissionCode);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filter by module:</span>
        <Badge
          variant={selectedModule === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedModule('all')}
        >
          All
        </Badge>
        {modules.map(([key, label]) => (
          <Badge
            key={key}
            variant={selectedModule === key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedModule(key)}
          >
            {label}
          </Badge>
        ))}
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium border-b sticky left-0 bg-gray-50 z-10">
                Module / Permission
              </th>
              {roles.map((role) => (
                <th key={role.id} className="text-center p-3 font-medium border-b min-w-[100px]">
                  <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                    {role.displayName}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredModules.map(([moduleKey, moduleLabel]) => {
              const modulePermissions = permissionsByModule[moduleKey] || [];
              return (
                <Fragment key={moduleKey}>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={roles.length + 1}
                      className="p-2 font-semibold text-gray-700 border-b"
                    >
                      {moduleLabel}
                    </td>
                  </tr>
                  {modulePermissions.map((permission) => (
                    <tr key={permission.code} className="hover:bg-gray-50">
                      <td className="p-3 border-b sticky left-0 bg-white z-10">
                        <div>
                          <p className="font-medium">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={`${role.id}-${permission.code}`} className="text-center p-3 border-b">
                          {hasPermission(role, permission.code) ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        <p>
          <Check className="w-4 h-4 text-green-600 inline mr-1" />
          Permission granted
          <X className="w-4 h-4 text-gray-300 inline ml-4 mr-1" />
          Permission not granted
        </p>
      </div>
    </div>
  );
}

/**
 * User Domain Model
 * Type definitions for User entity
 */

import type { Role } from '../index';

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string; // Omitted in responses
  role: Role;
  employeeId?: string | null;
  permissions?: UserPermissions | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserPermissions {
  [module: string]: string[];
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  role: Role;
  employeeId?: string;
  permissions?: UserPermissions;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  role?: Role;
  permissions?: UserPermissions;
}

export interface UserWithEmployee extends User {
  employee?: {
    id: string;
    name: string;
    designation: string;
    department: string;
  } | null;
}

export interface UserSession {
  userId: string;
  email: string;
  role: Role;
  employeeId?: string;
  name: string;
  permissions?: UserPermissions | null;
}

export interface IAMRole {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  color?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date | string;
  assignedBy?: string | null;
  role?: IAMRole;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module: string;
  action: string;
  isSystem: boolean;
}

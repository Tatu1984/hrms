/**
 * Admin Service
 * Business logic for admin operations
 */

import { adminApi, iamApi, usersApi, otherApi } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  IAMRole,
  Permission,
} from '@/types/models';

class AdminService {
  // =====================
  // User Management
  // =====================

  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    return usersApi.list() as Promise<ApiResponse<User[]>>;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return usersApi.getById(id) as Promise<ApiResponse<User>>;
  }

  /**
   * Create user
   */
  async createUser(data: CreateUserInput): Promise<ApiResponse<User>> {
    return usersApi.create(data) as Promise<ApiResponse<User>>;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<ApiResponse<User>> {
    return usersApi.update(id, data) as Promise<ApiResponse<User>>;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return usersApi.delete(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(id: string): Promise<ApiResponse<Record<string, string[]>>> {
    return usersApi.getPermissions(id) as Promise<ApiResponse<Record<string, string[]>>>;
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(
    id: string,
    permissions: Record<string, string[]>
  ): Promise<ApiResponse<void>> {
    return usersApi.updatePermissions(id, permissions) as Promise<ApiResponse<void>>;
  }

  // =====================
  // IAM Role Management
  // =====================

  /**
   * Get all roles
   */
  async getRoles(): Promise<ApiResponse<IAMRole[]>> {
    return iamApi.getRoles() as Promise<ApiResponse<IAMRole[]>>;
  }

  /**
   * Create role
   */
  async createRole(data: Partial<IAMRole>): Promise<ApiResponse<IAMRole>> {
    return iamApi.createRole(data) as Promise<ApiResponse<IAMRole>>;
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: Partial<IAMRole>): Promise<ApiResponse<IAMRole>> {
    return iamApi.updateRole(id, data) as Promise<ApiResponse<IAMRole>>;
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return iamApi.deleteRole(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    return iamApi.getPermissions() as Promise<ApiResponse<Permission[]>>;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<ApiResponse<void>> {
    return iamApi.assignUserRole(userId, roleId) as Promise<ApiResponse<void>>;
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<ApiResponse<void>> {
    return iamApi.removeUserRole(userId, roleId) as Promise<ApiResponse<void>>;
  }

  /**
   * Seed default IAM roles
   */
  async seedIAMRoles(): Promise<ApiResponse<void>> {
    return iamApi.seedRoles() as Promise<ApiResponse<void>>;
  }

  // =====================
  // Admin Operations
  // =====================

  /**
   * Force punch out an employee
   */
  async forcePunchout(employeeId: string): Promise<ApiResponse<void>> {
    return adminApi.forcePunchout(employeeId) as Promise<ApiResponse<void>>;
  }

  /**
   * Get suspicious activity logs
   */
  async getSuspiciousActivity(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<unknown[]>> {
    return adminApi.getSuspiciousActivity(params) as Promise<ApiResponse<unknown[]>>;
  }

  /**
   * Fix holiday attendance records
   */
  async fixHolidayAttendance(date: string): Promise<ApiResponse<void>> {
    return adminApi.fixHolidayAttendance({ date }) as Promise<ApiResponse<void>>;
  }

  // =====================
  // Configuration Management
  // =====================

  /**
   * Get designations
   */
  async getDesignations(): Promise<ApiResponse<unknown[]>> {
    return otherApi.getDesignations() as Promise<ApiResponse<unknown[]>>;
  }

  /**
   * Create designation
   */
  async createDesignation(data: { name: string; level?: number; departmentId?: string }): Promise<ApiResponse<unknown>> {
    return otherApi.createDesignation(data) as Promise<ApiResponse<unknown>>;
  }

  /**
   * Get departments
   */
  async getDepartments(): Promise<ApiResponse<unknown[]>> {
    return otherApi.getDepartments() as Promise<ApiResponse<unknown[]>>;
  }

  /**
   * Create department
   */
  async createDepartment(data: { name: string; code?: string; description?: string }): Promise<ApiResponse<unknown>> {
    return otherApi.createDepartment(data) as Promise<ApiResponse<unknown>>;
  }

  /**
   * Get holidays
   */
  async getHolidays(year?: number): Promise<ApiResponse<unknown[]>> {
    return otherApi.getHolidays({ year }) as Promise<ApiResponse<unknown[]>>;
  }

  /**
   * Create holiday
   */
  async createHoliday(data: { name: string; date: string; year: number; isOptional?: boolean }): Promise<ApiResponse<unknown>> {
    return otherApi.createHoliday(data) as Promise<ApiResponse<unknown>>;
  }

  // =====================
  // Audit & Reporting
  // =====================

  /**
   * Get audit log
   */
  async getAuditLog(params?: {
    userId?: string;
    entityType?: string;
  }): Promise<ApiResponse<unknown[]>> {
    return otherApi.getAuditLog(params) as Promise<ApiResponse<unknown[]>>;
  }

  /**
   * Get employee status summary
   */
  async getEmployeeStatus(): Promise<ApiResponse<unknown>> {
    return otherApi.getEmployeeStatus() as Promise<ApiResponse<unknown>>;
  }

  /**
   * Get time analytics
   */
  async getTimeAnalytics(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<unknown>> {
    return otherApi.getTimeAnalytics(params) as Promise<ApiResponse<unknown>>;
  }

  /**
   * Generate report
   */
  async generateReport(data: {
    reportType: string;
    month?: number;
    year?: number;
  }): Promise<ApiResponse<unknown>> {
    return otherApi.generateReport(data) as Promise<ApiResponse<unknown>>;
  }
}

// Export singleton instance
export const adminService = new AdminService();

// Export class for testing
export { AdminService };

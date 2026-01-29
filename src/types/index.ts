/**
 * Core Types Module
 * Basic type definitions used throughout the application
 */

// Core enums
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKEND';
export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'HOLD';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'HOLD' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type AccountType = 'INCOME' | 'EXPENSE';

// Re-export domain models
export * from './models';

// Re-export API types
export * from './api.types';

// Re-export component types
export * from './components.types';
/**
 * Project Domain Model
 * Type definitions for Project entity
 */

import type { ProjectStatus } from '../index';

export type ProjectType = 'MILESTONE' | 'RETAINER';

export interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string;
  sowDocument?: string | null;
  projectType: ProjectType;
  totalBudget?: number | null;
  upfrontPayment?: number | null;
  currency: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: ProjectStatus;
  milestones?: Milestone[] | null;
  successCriteria?: string | null;
  leadId?: string | null;
  saleId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Milestone {
  id?: string;
  name: string;
  description?: string;
  amount?: number;
  dueDate?: Date | string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID';
  completedDate?: Date | string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  role?: string | null;
  createdAt: Date | string;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
    department: string;
  };
}

export interface ProjectWithRelations extends Project {
  members?: ProjectMember[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
  lead?: {
    id: string;
    leadNumber: string;
    companyName: string;
  } | null;
  sale?: {
    id: string;
    saleNumber: string;
    netAmount: number;
  } | null;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  projectType: ProjectType;
  startDate: Date | string;
  endDate?: Date | string;
  totalBudget?: number;
  upfrontPayment?: number;
  currency?: string;
  milestones?: Milestone[];
  successCriteria?: string;
  memberIds?: string[];
  leadId?: string;
  saleId?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
  sowDocument?: string;
}

export interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  cancelledProjects: number;
  totalBudget: number;
  totalRevenue: number;
}

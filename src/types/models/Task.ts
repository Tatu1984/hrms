/**
 * Task Domain Model
 * Type definitions for Task entity
 */

import type { TaskStatus, Priority } from '../index';

export interface Task {
  id: string;
  projectId?: string | null;
  milestone?: string | null;
  assignedTo: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaskWithRelations extends Task {
  project?: {
    id: string;
    name: string;
    projectId: string;
  } | null;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
  updates?: TaskUpdate[];
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: Date | string;
}

export interface CreateTaskInput {
  projectId?: string;
  milestone?: string;
  assignedTo: string;
  title: string;
  description: string;
  priority?: Priority;
  dueDate?: Date | string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date | string | null;
  assignedTo?: string;
  milestone?: string;
}

export interface TaskSummary {
  totalTasks: number;
  pending: number;
  inProgress: number;
  onHold: number;
  completed: number;
  overdue: number;
}

export interface DailyWorkUpdate {
  id: string;
  employeeId: string;
  date: Date | string;
  workCompleted: string;
  obstaclesOvercome?: string | null;
  tasksLeft?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDailyWorkUpdateInput {
  employeeId?: string;
  date: Date | string;
  workCompleted: string;
  obstaclesOvercome?: string;
  tasksLeft?: string;
}

/**
 * Task Service
 * Business logic for task management
 */

import { tasksApi, otherApi } from '@/lib/api';
import type { ApiResponse, TaskParams } from '@/lib/api';
import type {
  Task,
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
  TaskSummary,
  DailyWorkUpdate,
  CreateDailyWorkUpdateInput,
} from '@/types/models';
import type { TaskStatus, Priority } from '@/types';

class TaskService {
  /**
   * Get tasks
   */
  async getTasks(params?: TaskParams): Promise<ApiResponse<TaskWithRelations[]>> {
    return tasksApi.list(params) as Promise<ApiResponse<TaskWithRelations[]>>;
  }

  /**
   * Get tasks by project
   */
  async getProjectTasks(projectId: string, params?: Omit<TaskParams, 'projectId'>): Promise<ApiResponse<TaskWithRelations[]>> {
    return this.getTasks({ ...params, projectId });
  }

  /**
   * Get tasks assigned to employee
   */
  async getEmployeeTasks(employeeId: string, params?: Omit<TaskParams, 'assignedTo'>): Promise<ApiResponse<TaskWithRelations[]>> {
    return this.getTasks({ ...params, assignedTo: employeeId });
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus, params?: Omit<TaskParams, 'status'>): Promise<ApiResponse<TaskWithRelations[]>> {
    return this.getTasks({ ...params, status });
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(params?: Omit<TaskParams, 'status'>): Promise<ApiResponse<TaskWithRelations[]>> {
    return this.getTasksByStatus('PENDING', params);
  }

  /**
   * Create task
   */
  async createTask(data: CreateTaskInput): Promise<ApiResponse<Task>> {
    return tasksApi.create(data) as Promise<ApiResponse<Task>>;
  }

  /**
   * Update task
   */
  async updateTask(data: UpdateTaskInput): Promise<ApiResponse<Task>> {
    const { id, ...updateData } = data;
    return tasksApi.update(id, updateData) as Promise<ApiResponse<Task>>;
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return tasksApi.delete(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<ApiResponse<Task>> {
    return this.updateTask({ id, status });
  }

  /**
   * Update task priority
   */
  async updatePriority(id: string, priority: Priority): Promise<ApiResponse<Task>> {
    return this.updateTask({ id, priority });
  }

  /**
   * Assign task to employee
   */
  async assignTask(id: string, employeeId: string): Promise<ApiResponse<Task>> {
    return this.updateTask({ id, assignedTo: employeeId });
  }

  /**
   * Get task summary
   */
  async getTaskSummary(params?: TaskParams): Promise<ApiResponse<TaskSummary>> {
    const result = await this.getTasks(params);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch tasks',
      };
    }

    const tasks = result.data;
    const today = new Date();
    const summary: TaskSummary = {
      totalTasks: tasks.length,
      pending: 0,
      inProgress: 0,
      onHold: 0,
      completed: 0,
      overdue: 0,
    };

    for (const task of tasks) {
      switch (task.status) {
        case 'PENDING':
          summary.pending++;
          break;
        case 'IN_PROGRESS':
          summary.inProgress++;
          break;
        case 'HOLD':
          summary.onHold++;
          break;
        case 'COMPLETED':
          summary.completed++;
          break;
      }

      // Check if overdue
      if (task.dueDate && task.status !== 'COMPLETED') {
        const dueDate = new Date(task.dueDate);
        if (dueDate < today) {
          summary.overdue++;
        }
      }
    }

    return { success: true, data: summary };
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(params?: TaskParams): Promise<ApiResponse<TaskWithRelations[]>> {
    const result = await this.getTasks(params);

    if (!result.success || !result.data) {
      return result;
    }

    const today = new Date();
    const overdueTasks = result.data.filter((task) => {
      if (!task.dueDate || task.status === 'COMPLETED') return false;
      return new Date(task.dueDate) < today;
    });

    return { success: true, data: overdueTasks };
  }

  /**
   * Get high priority tasks
   */
  async getHighPriorityTasks(params?: Omit<TaskParams, 'priority'>): Promise<ApiResponse<TaskWithRelations[]>> {
    const result = await this.getTasks(params);

    if (!result.success || !result.data) {
      return result;
    }

    const highPriorityTasks = result.data.filter(
      (task) => task.priority === 'HIGH' || task.priority === 'URGENT'
    );

    return { success: true, data: highPriorityTasks };
  }

  // Daily Work Updates

  /**
   * Get daily work updates
   */
  async getDailyWorkUpdates(params?: {
    employeeId?: string;
    date?: string;
  }): Promise<ApiResponse<DailyWorkUpdate[]>> {
    return otherApi.getDailyWorkUpdates(params) as Promise<ApiResponse<DailyWorkUpdate[]>>;
  }

  /**
   * Create daily work update
   */
  async createDailyWorkUpdate(data: CreateDailyWorkUpdateInput): Promise<ApiResponse<DailyWorkUpdate>> {
    return otherApi.createDailyWorkUpdate(data) as Promise<ApiResponse<DailyWorkUpdate>>;
  }

  /**
   * Get today's work update for employee
   */
  async getTodayWorkUpdate(employeeId: string): Promise<ApiResponse<DailyWorkUpdate | null>> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.getDailyWorkUpdates({ employeeId, date: today });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: true, data: null };
    }

    return { success: true, data: result.data[0] };
  }
}

// Export singleton instance
export const taskService = new TaskService();

// Export class for testing
export { TaskService };

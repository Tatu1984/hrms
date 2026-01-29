/**
 * Project Service
 * Business logic for project management
 */

import { projectsApi } from '@/lib/api';
import type { ApiResponse, PaginatedResponse, ProjectParams } from '@/lib/api';
import type {
  Project,
  ProjectWithRelations,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectMember,
  ProjectSummary,
} from '@/types/models';
import type { ProjectStatus } from '@/types';

class ProjectService {
  /**
   * Get paginated list of projects
   */
  async getProjects(params?: ProjectParams): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return projectsApi.list(params) as Promise<ApiResponse<PaginatedResponse<Project>>>;
  }

  /**
   * Get active projects
   */
  async getActiveProjects(params?: Omit<ProjectParams, 'status'>): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.getProjects({ ...params, status: 'ACTIVE' });
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ApiResponse<ProjectWithRelations>> {
    return projectsApi.getById(id) as Promise<ApiResponse<ProjectWithRelations>>;
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectInput): Promise<ApiResponse<Project>> {
    return projectsApi.create(data) as Promise<ApiResponse<Project>>;
  }

  /**
   * Update project
   */
  async updateProject(id: string, data: UpdateProjectInput): Promise<ApiResponse<Project>> {
    return projectsApi.update(id, data) as Promise<ApiResponse<Project>>;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return projectsApi.delete(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Update project status
   */
  async updateStatus(id: string, status: ProjectStatus): Promise<ApiResponse<Project>> {
    return this.updateProject(id, { status });
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.getProjects({ status });
  }

  /**
   * Search projects
   */
  async searchProjects(query: string): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.getProjects({ search: query });
  }

  /**
   * Get project summary
   */
  async getProjectSummary(): Promise<ApiResponse<ProjectSummary>> {
    const result = await this.getProjects({ pageSize: 1000 });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch projects',
      };
    }

    const projects = result.data.data;
    const summary: ProjectSummary = {
      totalProjects: projects.length,
      activeProjects: 0,
      completedProjects: 0,
      onHoldProjects: 0,
      cancelledProjects: 0,
      totalBudget: 0,
      totalRevenue: 0,
    };

    for (const project of projects) {
      switch (project.status) {
        case 'ACTIVE':
          summary.activeProjects++;
          break;
        case 'COMPLETED':
          summary.completedProjects++;
          break;
        case 'ON_HOLD':
          summary.onHoldProjects++;
          break;
        case 'CANCELLED':
          summary.cancelledProjects++;
          break;
      }

      if (project.totalBudget) {
        summary.totalBudget += project.totalBudget;
      }
    }

    return { success: true, data: summary };
  }

  /**
   * Get projects for an employee (as member)
   */
  async getEmployeeProjects(employeeId: string): Promise<ApiResponse<ProjectWithRelations[]>> {
    // This would typically be a dedicated endpoint
    // For now, fetch all and filter
    const result = await this.getProjects({ pageSize: 1000 });

    if (!result.success || !result.data) {
      return result as ApiResponse<ProjectWithRelations[]>;
    }

    // We'd need to fetch full project details to check members
    // This is a simplified version
    return {
      success: true,
      data: [], // Would need backend support
    };
  }

  /**
   * Calculate project progress based on milestones
   */
  calculateProgress(project: ProjectWithRelations): number {
    if (!project.milestones || project.milestones.length === 0) {
      return project.status === 'COMPLETED' ? 100 : 0;
    }

    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'COMPLETED' || m.status === 'PAID'
    ).length;

    return Math.round((completedMilestones / project.milestones.length) * 100);
  }

  /**
   * Calculate project budget utilization
   */
  calculateBudgetUtilization(project: ProjectWithRelations): {
    total: number;
    used: number;
    remaining: number;
    percentage: number;
  } {
    const total = project.totalBudget || 0;
    const upfront = project.upfrontPayment || 0;

    // Calculate based on completed milestones
    let earned = upfront;
    if (project.milestones) {
      for (const milestone of project.milestones) {
        if (milestone.status === 'COMPLETED' || milestone.status === 'PAID') {
          earned += milestone.amount || 0;
        }
      }
    }

    return {
      total,
      used: earned,
      remaining: total - earned,
      percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
    };
  }
}

// Export singleton instance
export const projectService = new ProjectService();

// Export class for testing
export { ProjectService };

'use client';

/**
 * useProjects Hook
 * Project management state and actions
 */

import { useState, useCallback } from 'react';
import { projectService } from '@/services';
import { useAuth } from './useAuth';
import type {
  Project,
  ProjectWithRelations,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectSummary,
} from '@/types/models';
import type { ProjectStatus } from '@/types';

interface UseProjectsOptions {
  autoFetch?: boolean;
  status?: ProjectStatus;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { isManagerOrAbove } = useAuth();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWithRelations | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(
    async (params?: { status?: ProjectStatus; search?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await projectService.getProjects({
          status: params?.status || options.status,
          search: params?.search,
        });
        if (result.success && result.data) {
          setProjects(result.data.data);
        } else {
          setError(result.error || 'Failed to fetch projects');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options.status]
  );

  // Fetch active projects
  const fetchActiveProjects = useCallback(async () => {
    return fetchProjects({ status: 'ACTIVE' });
  }, [fetchProjects]);

  // Fetch project by ID
  const fetchProjectById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await projectService.getProjectById(id);
      if (result.success && result.data) {
        setCurrentProject(result.data);
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch project');
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch project summary
  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await projectService.getProjectSummary();
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error || 'Failed to fetch summary');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create project
  const createProject = useCallback(
    async (data: CreateProjectInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await projectService.createProject(data);
        if (result.success && result.data) {
          // Add to local state
          setProjects((prev) => [result.data!, ...prev]);
          return result.data;
        } else {
          setError(result.error || 'Failed to create project');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update project
  const updateProject = useCallback(
    async (id: string, data: UpdateProjectInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await projectService.updateProject(id, data);
        if (result.success && result.data) {
          // Update local state
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...result.data } : p))
          );
          if (currentProject?.id === id) {
            setCurrentProject({ ...currentProject, ...result.data });
          }
          return result.data;
        } else {
          setError(result.error || 'Failed to update project');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentProject]
  );

  // Update project status
  const updateStatus = useCallback(
    async (id: string, status: ProjectStatus) => {
      return updateProject(id, { status });
    },
    [updateProject]
  );

  // Delete project
  const deleteProject = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await projectService.deleteProject(id);
        if (result.success) {
          // Remove from local state
          setProjects((prev) => prev.filter((p) => p.id !== id));
          if (currentProject?.id === id) {
            setCurrentProject(null);
          }
          return true;
        } else {
          setError(result.error || 'Failed to delete project');
          return false;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentProject]
  );

  // Search projects
  const searchProjects = useCallback(
    async (query: string) => {
      return fetchProjects({ search: query });
    },
    [fetchProjects]
  );

  // Calculate project progress
  const calculateProgress = useCallback((project: ProjectWithRelations) => {
    return projectService.calculateProgress(project);
  }, []);

  // Calculate budget utilization
  const calculateBudgetUtilization = useCallback((project: ProjectWithRelations) => {
    return projectService.calculateBudgetUtilization(project);
  }, []);

  // Clear current project
  const clearCurrentProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    projects,
    currentProject,
    summary,
    isLoading,
    error,

    // Permissions
    canManage: isManagerOrAbove,

    // Fetch actions
    fetchProjects,
    fetchActiveProjects,
    fetchProjectById,
    fetchSummary,
    searchProjects,

    // CRUD actions
    createProject,
    updateProject,
    updateStatus,
    deleteProject,

    // Utilities
    calculateProgress,
    calculateBudgetUtilization,
    clearCurrentProject,
    clearError,
  };
}

export default useProjects;

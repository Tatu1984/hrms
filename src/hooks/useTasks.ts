'use client';

/**
 * useTasks Hook
 * Task management state and actions
 */

import { useState, useCallback } from 'react';
import { taskService } from '@/services';
import { useAuth } from './useAuth';
import type {
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
  TaskSummary,
  DailyWorkUpdate,
  CreateDailyWorkUpdateInput,
} from '@/types/models';
import type { TaskStatus, Priority } from '@/types';

interface UseTasksOptions {
  projectId?: string;
  employeeId?: string;
  status?: TaskStatus;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { employeeId: currentEmployeeId, isManagerOrAbove } = useAuth();

  // State
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [myTasks, setMyTasks] = useState<TaskWithRelations[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [dailyUpdates, setDailyUpdates] = useState<DailyWorkUpdate[]>([]);
  const [todayUpdate, setTodayUpdate] = useState<DailyWorkUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(
    async (params?: {
      projectId?: string;
      assignedTo?: string;
      status?: TaskStatus;
      priority?: Priority;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.getTasks({
          projectId: params?.projectId || options.projectId,
          assignedTo: params?.assignedTo || options.employeeId,
          status: params?.status || options.status,
          priority: params?.priority,
        });
        if (result.success && result.data) {
          setTasks(result.data);
        } else {
          setError(result.error || 'Failed to fetch tasks');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options.projectId, options.employeeId, options.status]
  );

  // Fetch my tasks
  const fetchMyTasks = useCallback(
    async (params?: { status?: TaskStatus; priority?: Priority }) => {
      if (!currentEmployeeId) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.getEmployeeTasks(currentEmployeeId, params);
        if (result.success && result.data) {
          setMyTasks(result.data);
        } else {
          setError(result.error || 'Failed to fetch tasks');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentEmployeeId]
  );

  // Fetch project tasks
  const fetchProjectTasks = useCallback(
    async (projectId: string, params?: { status?: TaskStatus }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.getProjectTasks(projectId, params);
        if (result.success && result.data) {
          setTasks(result.data);
        } else {
          setError(result.error || 'Failed to fetch tasks');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch task summary
  const fetchSummary = useCallback(
    async (params?: { projectId?: string; assignedTo?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.getTaskSummary(params);
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || 'Failed to fetch summary');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Create task
  const createTask = useCallback(async (data: CreateTaskInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.createTask(data);
      if (result.success && result.data) {
        // Add to local state
        setTasks((prev) => [result.data as TaskWithRelations, ...prev]);
        return result.data;
      } else {
        setError(result.error || 'Failed to create task');
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update task
  const updateTask = useCallback(async (data: UpdateTaskInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.updateTask(data);
      if (result.success && result.data) {
        // Update local state
        setTasks((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, ...result.data } : t))
        );
        setMyTasks((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, ...result.data } : t))
        );
        return result.data;
      } else {
        setError(result.error || 'Failed to update task');
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update task status
  const updateStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      return updateTask({ id, status });
    },
    [updateTask]
  );

  // Update task priority
  const updatePriority = useCallback(
    async (id: string, priority: Priority) => {
      return updateTask({ id, priority });
    },
    [updateTask]
  );

  // Assign task
  const assignTask = useCallback(
    async (id: string, employeeId: string) => {
      return updateTask({ id, assignedTo: employeeId });
    },
    [updateTask]
  );

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.deleteTask(id);
      if (result.success) {
        // Remove from local state
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setMyTasks((prev) => prev.filter((t) => t.id !== id));
        return true;
      } else {
        setError(result.error || 'Failed to delete task');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Daily Work Updates

  // Fetch daily work updates
  const fetchDailyUpdates = useCallback(
    async (params?: { employeeId?: string; date?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.getDailyWorkUpdates(params);
        if (result.success && result.data) {
          setDailyUpdates(result.data);
        } else {
          setError(result.error || 'Failed to fetch daily updates');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch today's update
  const fetchTodayUpdate = useCallback(async () => {
    if (!currentEmployeeId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await taskService.getTodayWorkUpdate(currentEmployeeId);
      if (result.success) {
        setTodayUpdate(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch today update');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentEmployeeId]);

  // Create daily work update
  const createDailyUpdate = useCallback(
    async (data: Omit<CreateDailyWorkUpdateInput, 'employeeId'>) => {
      if (!currentEmployeeId) {
        setError('Employee ID not found');
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.createDailyWorkUpdate({
          ...data,
          employeeId: currentEmployeeId,
        });
        if (result.success && result.data) {
          setTodayUpdate(result.data);
          return result.data;
        } else {
          setError(result.error || 'Failed to create daily update');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentEmployeeId]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    tasks,
    myTasks,
    summary,
    dailyUpdates,
    todayUpdate,
    isLoading,
    error,

    // Permissions
    canManage: isManagerOrAbove,

    // Task fetch actions
    fetchTasks,
    fetchMyTasks,
    fetchProjectTasks,
    fetchSummary,

    // Task CRUD actions
    createTask,
    updateTask,
    updateStatus,
    updatePriority,
    assignTask,
    deleteTask,

    // Daily update actions
    fetchDailyUpdates,
    fetchTodayUpdate,
    createDailyUpdate,

    // Utilities
    clearError,
  };
}

export default useTasks;

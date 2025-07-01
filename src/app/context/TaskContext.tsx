"use client";
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { taskService, socketService } from '@/services';
import { useAuth } from './AuthContext';
import type { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  CreateTaskRequest, 
  UpdateTaskRequest 
} from '@/types/api';

interface TaskContextType {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: number, data: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<Task | null>;
  startTask: (id: number) => Promise<Task | null>;
  updateTaskProgress: (id: number, percentage: number) => Promise<Task | null>;
  
  // Filters and search
  filterTasksByStatus: (status: TaskStatus) => Task[];
  filterTasksByPriority: (priority: TaskPriority) => Task[];
  searchTasks: (query: string) => Task[];
  getOverdueTasks: () => Task[];
  getTaskById: (id: number) => Task | undefined;
  
  // Statistics
  getTaskStats: () => {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTasks = await taskService.getAllTasks();
      // Ensure we always set an array, even if the service returns undefined/null
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
      // Ensure tasks remains an array even on error
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Create new task
  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task | null> => {
    setError(null);
    
    try {
      const newTask = await taskService.createTask(data);
      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      console.error('Error creating task:', err);
      return null;
    }
  }, []);

  // Update existing task
  const updateTask = useCallback(async (id: number, data: UpdateTaskRequest): Promise<Task | null> => {
    setError(null);
    
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks(prevTasks =>
        prevTasks.map(task => task.id === id ? updatedTask : task)
      );
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      console.error('Error updating task:', err);
      return null;
    }
  }, []);

  // Delete task
  const deleteTask = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    
    try {
      await taskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
      return false;
    }
  }, []);

  // Complete task (shortcut method)
  const completeTask = useCallback(async (id: number): Promise<Task | null> => {
    return updateTask(id, { status: 'COMPLETED', completionPercentage: 100 });
  }, [updateTask]);

  // Start task (shortcut method)
  const startTask = useCallback(async (id: number): Promise<Task | null> => {
    return updateTask(id, { status: 'IN_PROGRESS' });
  }, [updateTask]);

  // Update task progress
  const updateTaskProgress = useCallback(async (id: number, percentage: number): Promise<Task | null> => {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const status: TaskStatus = clampedPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS';
    
    return updateTask(id, { 
      completionPercentage: clampedPercentage,
      status
    });
  }, [updateTask]);

  // Filter tasks by status
  const filterTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // Filter tasks by priority
  const filterTasksByPriority = useCallback((priority: TaskPriority): Task[] => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  // Search tasks
  const searchTasks = useCallback((query: string): Task[] => {
    const lowercaseQuery = query.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description?.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [tasks]);

  // Get overdue tasks
  const getOverdueTasks = useCallback((): Task[] => {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'COMPLETED'
    );
  }, [tasks]);

  // Get task by ID
  const getTaskById = useCallback((id: number): Task | undefined => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  // Get task statistics
  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = getOverdueTasks().length;

    return { total, pending, inProgress, completed, overdue };
  }, [tasks, getOverdueTasks]);

  // Setup real-time task updates via socket
  useEffect(() => {
    const handleTaskUpdate = (updatedTask: Task) => {
      setTasks(prevTasks => {
        const existingTaskIndex = prevTasks.findIndex(task => task.id === updatedTask.id);
        
        if (existingTaskIndex >= 0) {
          // Update existing task
          const newTasks = [...prevTasks];
          newTasks[existingTaskIndex] = updatedTask;
          return newTasks;
        } else {
          // Add new task
          return [...prevTasks, updatedTask];
        }
      });
    };

    // Subscribe to real-time task updates
    const unsubscribe = socketService.onTaskUpdated(handleTaskUpdate);

    return unsubscribe;
  }, []);

  // Fetch tasks when authentication status changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const contextValue: TaskContextType = {
    // State
    tasks,
    isLoading,
    error,
    
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
    updateTaskProgress,
    
    // Filters and search
    filterTasksByStatus,
    filterTasksByPriority,
    searchTasks,
    getOverdueTasks,
    getTaskById,
    
    // Statistics
    getTaskStats
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
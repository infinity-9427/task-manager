'use client'

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { Task, CreateTaskInput, TaskUpdateInput, TaskStatus, TaskPriority } from '@/types'
import { QUERY_KEYS } from '@/lib/constants'
import { taskAPI } from '@/lib/task-api'
import { safeToast } from '@/lib/toast-utils'
import { useAuth } from '@/contexts/auth-context'

interface TaskQueryParams {
  status?: string
  assignee?: string
  priority?: string
  search?: string
  page?: number
  limit?: number
}

interface TaskMutationContext {
  previousTasks?: Task[]
}

interface UseTasksResult {
  data?: Task[]
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => void
  invalidate: () => void
}

interface TaskMutationCallbacks {
  onSuccess?: (data: Task) => void
  onError?: (error: Error) => void
}

export function useTasks(params?: TaskQueryParams): UseTasksResult {
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const query = useQuery({
    queryKey: [...QUERY_KEYS.tasks, params],
    enabled: isAuthenticated && !authLoading,
    queryFn: async () => {
      try {
        const result = await taskAPI.getTasks(params)
        // Safe mapping with fallback
        return (result?.tasks || []).filter(task => task && typeof task === 'object' && task.id)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        
        // Enhanced error handling with specific error types
        if (error && typeof error === 'object') {
          const apiError = error as any
          
          console.error('useTasks error:', {
            status: apiError.status,
            message: apiError.message,
            error: apiError
          })
          
          if (apiError.status === 401) {
            // Clear auth state and redirect
            if (typeof window !== 'undefined') {
              document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
              document.cookie = 'auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
              window.location.href = '/auth?mode=login'
            }
            throw new Error('Authentication required. Please log in again.')
          }
          
          if (apiError.status === 403) {
            throw new Error('Access denied. You do not have permission to view these tasks.')
          }
          
          if (apiError.status === 404) {
            throw new Error('Tasks not found or service unavailable.')
          }
          
          if (apiError.status >= 500) {
            throw new Error('Server error. Please try again later.')
          }
          
          if (apiError.message) {
            throw new Error(apiError.message)
          }
        }
        
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry auth errors or client errors
      if (error && typeof error === 'object') {
        const apiError = error as any
        if (apiError?.status === 401 || apiError?.status === 403 || (apiError?.status >= 400 && apiError?.status < 500)) {
          return false
        }
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
  }

  return {
    ...query,
    invalidate
  }
}

export function useCreateTask(callbacks?: TaskMutationCallbacks): UseMutationResult<Task, Error, CreateTaskInput, TaskMutationContext> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newTask: CreateTaskInput): Promise<Task> => {
      try {
        return await taskAPI.createTask(newTask)
      } catch (error) {
        console.error('Failed to create task:', error)
        throw error
      }
    },
    onMutate: async (newTask: CreateTaskInput): Promise<TaskMutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks })
      
      const previousTasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks)
      
      // Optimistically update the cache with safe data handling
      if (previousTasks && Array.isArray(previousTasks)) {
        const optimisticTask: Task = {
          id: Date.now(), // Temporary ID
          title: newTask?.title || 'Untitled Task',
          description: newTask?.description || '',
          status: newTask?.status || TaskStatus.TO_DO,
          priority: newTask?.priority || TaskPriority.MEDIUM,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentId: newTask?.parentId || null,
          assigneeId: newTask?.assigneeId || null,
          children: []
        }
        
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, [...previousTasks, optimisticTask])
      }
      
      return { previousTasks }
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      
      safeToast.success('Task created successfully!', {
        description: `"${newTask?.title || 'New task'}" has been added to your tasks.`
      })
      
      callbacks?.onSuccess?.(newTask)
    },
    onError: (error, newTask, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, context.previousTasks)
      }
      
      safeToast.apiError(error, 'Creation Failed')
      
      callbacks?.onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
    }
  })
}

export function useDeleteTask(callbacks?: { onSuccess?: () => void; onError?: (error: Error) => void }): UseMutationResult<void, Error, number, TaskMutationContext> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (taskId: number): Promise<void> => {
      try {
        await taskAPI.deleteTask(taskId)
      } catch (error) {
        console.error(`Failed to delete task ${taskId}:`, error)
        throw error
      }
    },
    onMutate: async (taskId: number): Promise<TaskMutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks })
      
      const previousTasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks)
      
      // Optimistically remove the task with safe filtering
      if (previousTasks && Array.isArray(previousTasks)) {
        const filteredTasks = previousTasks.filter(task => task?.id && task.id !== taskId)
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, filteredTasks)
      }
      
      return { previousTasks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      
      safeToast.success('Task deleted successfully!')
      callbacks?.onSuccess?.()
    },
    onError: (error, taskId, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, context.previousTasks)
      }
      
      safeToast.apiError(error, 'Deletion Failed')
      
      callbacks?.onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
    }
  })
}

export function useToggleTask(callbacks?: TaskMutationCallbacks): UseMutationResult<Task, Error, number, TaskMutationContext> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (taskId: number): Promise<Task> => {
      try {
        const tasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks) || []
        const task = tasks.find(t => t.id === taskId)
        
        if (!task) {
          throw new Error('Task not found')
        }
        
        const newStatus = task.completed ? TaskStatus.TO_DO : TaskStatus.COMPLETED
        
        return await taskAPI.updateTask(taskId, { 
          status: newStatus,
          completed: !task.completed
        })
      } catch (error) {
        console.error(`Failed to toggle task ${taskId}:`, error)
        throw error
      }
    },
    onMutate: async (taskId: number): Promise<TaskMutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks })
      
      const previousTasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks)
      
      // Optimistically update the task status with safe mapping
      if (previousTasks && Array.isArray(previousTasks)) {
        const updatedTasks = previousTasks.map(task => 
          task?.id === taskId 
            ? { 
                ...task, 
                completed: !task.completed,
                status: task.completed ? TaskStatus.TO_DO : TaskStatus.COMPLETED,
                updatedAt: new Date().toISOString()
              }
            : task
        ).filter(Boolean) // Remove any null/undefined tasks
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, updatedTasks)
      }
      
      return { previousTasks }
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      
      const action = updatedTask?.completed ? 'completed' : 'reopened'
      safeToast.success(`Task ${action} successfully!`)
      
      callbacks?.onSuccess?.(updatedTask)
    },
    onError: (error, taskId, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, context.previousTasks)
      }
      
      safeToast.apiError(error, 'Update Failed')
      
      callbacks?.onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
    }
  })
}

export function useUpdateTask(callbacks?: TaskMutationCallbacks): UseMutationResult<Task, Error, { id: number; updates: TaskUpdateInput }, TaskMutationContext> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: TaskUpdateInput }): Promise<Task> => {
      try {
        return await taskAPI.updateTask(id, updates)
      } catch (error) {
        console.error(`Failed to update task ${id}:`, error)
        throw error
      }
    },
    onMutate: async ({ id, updates }): Promise<TaskMutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks })
      
      const previousTasks = queryClient.getQueryData<Task[]>(QUERY_KEYS.tasks)
      
      // Optimistically update the task with safe mapping
      if (previousTasks && Array.isArray(previousTasks)) {
        const updatedTasks = previousTasks.map(task => 
          task?.id === id 
            ? { 
                ...task, 
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : task
        ).filter(Boolean) // Remove any null/undefined tasks
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, updatedTasks)
      }
      
      return { previousTasks }
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      
      safeToast.success('Task updated successfully!')
      callbacks?.onSuccess?.(updatedTask)
    },
    onError: (error, { id: _id }, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, context.previousTasks)
      }
      
      safeToast.apiError(error, 'Update Failed')
      
      callbacks?.onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
    }
  })
}


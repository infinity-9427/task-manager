'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, CreateTaskInput } from '@/types'
import { QUERY_KEYS } from '@/lib/constants'

const DUMMY_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern and responsive landing page for the product',
    completed: false,
    priority: 'high',
    dueDate: '2024-10-20',
    createdAt: '2024-10-14T10:00:00Z',
    updatedAt: '2024-10-14T10:00:00Z',
  },
  {
    id: '2',
    title: 'Review pull requests',
    description: 'Review and merge pending pull requests from the team',
    completed: true,
    priority: 'medium',
    createdAt: '2024-10-13T14:30:00Z',
    updatedAt: '2024-10-14T09:15:00Z',
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update the API documentation with latest changes',
    completed: false,
    priority: 'low',
    dueDate: '2024-10-25',
    createdAt: '2024-10-12T16:45:00Z',
    updatedAt: '2024-10-12T16:45:00Z',
  },
  {
    id: '4',
    title: 'Implement user authentication',
    description: 'Set up JWT-based authentication system',
    completed: false,
    priority: 'high',
    dueDate: '2024-10-18',
    createdAt: '2024-10-11T11:20:00Z',
    updatedAt: '2024-10-14T08:30:00Z',
  },
  {
    id: '5',
    title: 'Optimize database queries',
    description: 'Improve performance of slow database queries',
    completed: false,
    priority: 'medium',
    createdAt: '2024-10-10T13:15:00Z',
    updatedAt: '2024-10-10T13:15:00Z',
  },
]

export function useTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async (): Promise<Task[]> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return DUMMY_TASKS
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newTask: CreateTaskInput): Promise<Task> => {
      await new Promise(resolve => setTimeout(resolve, 300))
      const task: Task = {
        ...newTask,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return task
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) => 
        old ? [newTask, ...old] : [newTask]
      )
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (_taskId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300))
    },
    onSuccess: (_, deletedTaskId) => {
      queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) =>
        old ? old.filter(task => task.id !== deletedTaskId) : []
      )
    },
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (_taskId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300))
    },
    onSuccess: (_, toggledTaskId) => {
      queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) =>
        old ? old.map(task => 
          task.id === toggledTaskId 
            ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
            : task
        ) : []
      )
    },
  })
}
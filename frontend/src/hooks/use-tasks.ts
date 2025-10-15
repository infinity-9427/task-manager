'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, CreateTaskInput, TaskUpdateInput, TaskStatus } from '@/types'
import { QUERY_KEYS, DUMMY_USERS } from '@/lib/constants'
import { toast } from 'sonner'

const DUMMY_TASKS: Task[] = [
  {
    id: '1',
    title: 'Plan for vacation',
    description: 'Organize upcoming vacation trip',
    completed: false,
    status: TaskStatus.PENDING,
    priority: 'medium',
    dueDate: '2024-10-25',
    createdAt: '2024-10-14T10:00:00Z',
    updatedAt: '2024-10-14T10:00:00Z',
    assigneeId: 'user-1',
    assignee: DUMMY_USERS[0],
  },
  {
    id: '2',
    title: 'Book flights',
    description: 'Research and book airline tickets',
    completed: false,
    status: TaskStatus.PENDING,
    priority: 'high',
    parentId: '1',
    createdAt: '2024-10-13T14:30:00Z',
    updatedAt: '2024-10-14T09:15:00Z',
    assigneeId: 'user-2',
    assignee: DUMMY_USERS[1],
  },
  {
    id: '3',
    title: 'Reserve hotel',
    description: 'Find and book accommodation',
    completed: true,
    status: TaskStatus.COMPLETED,
    priority: 'high',
    parentId: '1',
    createdAt: '2024-10-12T16:45:00Z',
    updatedAt: '2024-10-12T16:45:00Z',
    assigneeId: 'user-1',
    assignee: DUMMY_USERS[0],
  },
  {
    id: '4',
    title: 'Pack luggage',
    description: 'Prepare clothes and essentials',
    completed: false,
    status: TaskStatus.PENDING,
    priority: 'low',
    parentId: '1',
    createdAt: '2024-10-11T11:20:00Z',
    updatedAt: '2024-10-14T08:30:00Z',
    assigneeId: 'user-1',
    assignee: DUMMY_USERS[0],
  },
  {
    id: '5',
    title: 'Project Development',
    description: 'Complete the new feature implementation',
    completed: false,
    status: TaskStatus.IN_PROGRESS,
    priority: 'high',
    dueDate: '2024-10-30',
    createdAt: '2024-10-10T13:15:00Z',
    updatedAt: '2024-10-10T13:15:00Z',
    assigneeId: 'user-3',
    assignee: DUMMY_USERS[2],
  },
  {
    id: '6',
    title: 'Design UI mockups',
    description: 'Create wireframes and mockups',
    completed: true,
    status: TaskStatus.COMPLETED,
    priority: 'medium',
    parentId: '5',
    createdAt: '2024-10-09T10:00:00Z',
    updatedAt: '2024-10-10T15:00:00Z',
    assigneeId: 'user-4',
    assignee: DUMMY_USERS[3],
  },
  {
    id: '7',
    title: 'Implement backend API',
    description: 'Create REST endpoints',
    completed: false,
    status: TaskStatus.IN_PROGRESS,
    priority: 'high',
    parentId: '5',
    createdAt: '2024-10-08T14:00:00Z',
    updatedAt: '2024-10-08T14:00:00Z',
    assigneeId: 'user-3',
    assignee: DUMMY_USERS[2],
  },
  {
    id: '8',
    title: 'Write unit tests',
    description: 'Add comprehensive test coverage',
    completed: false,
    status: TaskStatus.PENDING,
    priority: 'medium',
    parentId: '5',
    createdAt: '2024-10-07T16:00:00Z',
    updatedAt: '2024-10-07T16:00:00Z',
    assigneeId: 'user-2',
    assignee: DUMMY_USERS[1],
  },
  {
    id: '9',
    title: 'Weekly Reports',
    description: 'Prepare and submit weekly status reports',
    completed: true,
    status: TaskStatus.COMPLETED,
    priority: 'low',
    createdAt: '2024-10-06T09:00:00Z',
    updatedAt: '2024-10-13T17:00:00Z',
    assigneeId: 'user-1',
    assignee: DUMMY_USERS[0],
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
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        const assignee = newTask.assigneeId ? DUMMY_USERS.find(u => u.id === newTask.assigneeId) : undefined
        const task: Task = {
          ...newTask,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignee,
        }
        return task
      } catch (error) {
        console.error('Failed to create task:', error)
        throw new Error('Failed to create task. Please try again.')
      }
    },
    onSuccess: (newTask) => {
      try {
        queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) => 
          old ? [newTask, ...old] : [newTask]
        )
        toast.success('Task created successfully!', {
          description: `"${newTask.title}" has been added to your tasks.`
        })
      } catch (error) {
        console.error('Error updating cache:', error)
        toast.error('Task created but failed to update display. Please refresh.')
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create task'
      toast.error('Creation Failed', {
        description: message
      })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (_taskId: string): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error('Failed to delete task:', error)
        throw new Error('Failed to delete task. Please try again.')
      }
    },
    onSuccess: (_, deletedTaskId) => {
      try {
        queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) => {
          if (!old) return []
          
          // Remove the deleted task and all its children
          const tasksToRemove = new Set([deletedTaskId])
          
          // Find all children of the deleted task (recursively)
          const findChildren = (parentId: string) => {
            old.forEach(task => {
              if (task.parentId === parentId) {
                tasksToRemove.add(task.id)
                findChildren(task.id) // Recursively find children of children
              }
            })
          }
          
          findChildren(deletedTaskId)
          
          const remainingTasks = old.filter(task => !tasksToRemove.has(task.id))
          
          if (tasksToRemove.size > 1) {
            toast.success(`Task and ${tasksToRemove.size - 1} subtask(s) deleted successfully!`)
          } else {
            toast.success('Task deleted successfully!')
          }
          
          return remainingTasks
        })
      } catch (error) {
        console.error('Error updating cache:', error)
        toast.error('Task deleted but failed to update display. Please refresh.')
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to delete task'
      toast.error('Deletion Failed', {
        description: message
      })
    }
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (_taskId: string): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error('Failed to toggle task:', error)
        throw new Error('Failed to update task. Please try again.')
      }
    },
    onSuccess: (_, toggledTaskId) => {
      try {
        queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) => {
          if (!old) return []
          
          const updatedTasks = old.map(task => 
            task.id === toggledTaskId 
              ? { 
                  ...task, 
                  completed: !task.completed, 
                  status: !task.completed ? TaskStatus.COMPLETED : TaskStatus.PENDING,
                  updatedAt: new Date().toISOString() 
                }
              : task
          )
          
          // Check for automatic parent completion
          const autoCompletedTasks = checkAndCompleteParents(updatedTasks)
          
          return autoCompletedTasks
        })
        
        toast.success('Task updated successfully!')
      } catch (error) {
        console.error('Error updating cache:', error)
        toast.error('Task updated but failed to update display. Please refresh.')
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      toast.error('Update Failed', {
        description: message
      })
    }
  })
}

// Helper function to automatically complete parent tasks when all children are completed
function checkAndCompleteParents(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map(task => [task.id, task]))
  let hasChanges = false
  const updatedTasks = [...tasks]
  
  // Get all parent tasks (tasks with children)
  const parentTasks = tasks.filter(task => 
    tasks.some(otherTask => otherTask.parentId === task.id)
  )
  
  parentTasks.forEach(parent => {
    // Get all children of this parent
    const children = tasks.filter(task => task.parentId === parent.id)
    
    // Check if all children are completed
    const allChildrenCompleted = children.length > 0 && children.every(child => child.completed)
    
    // If all children are completed but parent is not, complete the parent
    if (allChildrenCompleted && !parent.completed) {
      const parentIndex = updatedTasks.findIndex(task => task.id === parent.id)
      if (parentIndex !== -1) {
        updatedTasks[parentIndex] = {
          ...parent,
          completed: true,
          status: TaskStatus.COMPLETED,
          updatedAt: new Date().toISOString()
        }
        hasChanges = true
        
        // Show notification for auto-completion
        toast.success('Parent task auto-completed!', {
          description: `"${parent.title}" was automatically completed because all subtasks are done.`
        })
      }
    }
  })
  
  return updatedTasks
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdateInput }): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error('Failed to update task:', error)
        throw new Error('Failed to update task. Please try again.')
      }
    },
    onSuccess: (_, { id, updates }) => {
      try {
        queryClient.setQueryData(QUERY_KEYS.tasks, (old: Task[] | undefined) => {
          if (!old) return []
          
          const updatedTasks = old.map(task => {
            if (task.id === id) {
              const updatedTask = { 
                ...task, 
                ...updates, 
                updatedAt: new Date().toISOString(),
                assignee: updates.assigneeId ? DUMMY_USERS.find(u => u.id === updates.assigneeId) : task.assignee
              }
              return updatedTask
            }
            return task
          })
          
          // Check for automatic parent completion if task was completed
          if (updates.completed === true) {
            return checkAndCompleteParents(updatedTasks)
          }
          
          return updatedTasks
        })
        
        toast.success('Task updated successfully!')
      } catch (error) {
        console.error('Error updating cache:', error)
        toast.error('Task updated but failed to update display. Please refresh.')
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      toast.error('Update Failed', {
        description: message
      })
    }
  })
}
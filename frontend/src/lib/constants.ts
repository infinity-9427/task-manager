import { TaskPriority } from '@/types'

export const APP_CONFIG = {
  name: 'Task App',
  description: 'A beautiful task management application',
  version: '1.0.0',
} as const

export const TASK_PRIORITIES: Record<TaskPriority, { label: string; color: string }> = {
  low: {
    label: 'Low',
    color: 'text-green-600 bg-green-100',
  },
  medium: {
    label: 'Medium', 
    color: 'text-yellow-600 bg-yellow-100',
  },
  high: {
    label: 'High',
    color: 'text-red-600 bg-red-100',
  },
} as const

export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  users: ['users'] as const,
} as const

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
} as const

// Search configuration
export const SEARCH_CONFIG = {
  minQueryLength: 1,
  debounceMs: 150,
  maxResults: 10,
} as const

// UI Configuration
export const UI_CONFIG = {
  header: {
    height: '64px',
    zIndex: 50,
  },
  animations: {
    duration: '150ms',
  },
} as const
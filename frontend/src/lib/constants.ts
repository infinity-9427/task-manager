import { TaskPriority, User } from '@/types'

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

export const DUMMY_USERS: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'user-2', 
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'user-3',
    name: 'Mike Johnson', 
    email: 'mike.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'user-4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  }
] as const

export const CURRENT_USER_ID = 'user-1' as const

export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  users: ['users'] as const,
} as const

export const ROUTES = {
  home: '/',
  tasks: '/tasks',
  chat: '/chat',
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
import { TaskPriority, User } from '@/types'

export const APP_CONFIG = {
  name: 'Task App',
  description: 'A beautiful task management application',
  version: '1.0.0',
} as const

export const TASK_PRIORITIES: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: {
    label: 'Low',
    color: 'text-green-600 bg-green-100',
  },
  [TaskPriority.MEDIUM]: {
    label: 'Medium', 
    color: 'text-yellow-600 bg-yellow-100',
  },
  [TaskPriority.HIGH]: {
    label: 'High',
    color: 'text-red-600 bg-red-100',
  },
  [TaskPriority.URGENT]: {
    label: 'Urgent',
    color: 'text-purple-600 bg-purple-100',
  },
} as const

// All user data now comes from the database via authentication

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  tasks: {
    list: '/api/tasks',
    create: '/api/tasks',
    update: (id: string) => `/api/tasks/${id}`,
    delete: (id: string) => `/api/tasks/${id}`,
    byId: (id: string) => `/api/tasks/${id}`,
  },
  messages: {
    general: '/api/messages/general',
    direct: (userId: string) => `/api/messages/direct/${userId}`,
    users: '/api/messages/users',
    send: '/api/messages',
  },
  users: '/api/users',
} as const

export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  users: ['users'] as const,
  messages: ['messages'] as const,
} as const

export const ROUTES = {
  home: '/',
  tasks: '/tasks',
  chat: '/chat',
  auth: '/auth',
  login: '/auth',
  register: '/auth',
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
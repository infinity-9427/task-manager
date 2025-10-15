export interface Task {
  readonly id: string
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  dueDate?: string
  readonly createdAt: string
  updatedAt: string
}

export type TaskPriority = 'low' | 'medium' | 'high'

export interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  completed: boolean
}

export interface TaskUpdateInput extends Partial<Omit<CreateTaskInput, 'completed'>> {
  completed?: boolean
}

export interface User {
  readonly id: string
  name: string
  email: string
  avatar?: string | null
}

export interface AuthState {
  readonly isAuthenticated: boolean
  user?: User | null
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// Search types
export interface SearchFilters {
  query: string
  priority?: TaskPriority
  completed?: boolean
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}
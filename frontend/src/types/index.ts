export interface Task {
  readonly id: string
  title: string
  description?: string
  completed: boolean
  status?: TaskStatus
  priority: TaskPriority
  dueDate?: string
  readonly createdAt: string
  updatedAt: string
  parentId?: string
  children?: Task[]
  isExpanded?: boolean
  assigneeId?: string
  assignee?: User
}

export type TaskPriority = 'low' | 'medium' | 'high'

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed'
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  completed: boolean
  parentId?: string
  assigneeId?: string
}

export interface SubTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
}

export interface CreateTaskWithSubtasksInput extends CreateTaskInput {
  subtasks?: SubTaskInput[]
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
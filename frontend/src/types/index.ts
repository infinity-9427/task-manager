export interface Task {
  readonly id: number
  title: string
  description?: string
  completed: boolean
  status?: TaskStatus
  priority: TaskPriority
  dueDate?: string
  readonly createdAt: string
  updatedAt: string
  parentId?: number
  children?: Task[]
  subtasks?: Task[]
  isExpanded?: boolean
  assigneeId?: number
  assignee?: User
  createdBy?: User
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  status?: TaskStatus
  dueDate?: string
  completed?: boolean
  parentId?: number
  assigneeId?: number
}

export interface SubTaskInput {
  title: string
  description?: string
  dueDate?: string
}

export interface CreateTaskWithSubtasksInput extends CreateTaskInput {
  subtasks?: SubTaskInput[]
}

export interface TaskUpdateInput extends Partial<CreateTaskInput> {
  completed?: boolean
}

export interface User {
  readonly id: number
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
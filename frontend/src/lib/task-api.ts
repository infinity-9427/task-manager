'use client'

import { Task, CreateTaskInput, TaskUpdateInput } from '@/types'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ApiResponse<T> {
  task?: T
  tasks?: T[]
  pagination?: {
    total: number
    page: number
    pages: number
    limit: number
  }
  error?: string
  message?: string
}

interface TaskQueryParams {
  status?: string
  assignee?: string
  priority?: string
  search?: string
  page?: number
  limit?: number
}

class TaskAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'TaskAPIError'
  }
}

class TaskAPI {
  private readonly baseURL: string
  private readonly defaultTimeout = 30000

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_BASE_URL
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken()
    
    if (!token) {
      console.warn('TaskAPI: No auth token available for request')
    } else {
      console.log('TaskAPI: Using token:', token.substring(0, 20) + '...')
    }
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    
    try {
      return Cookies.get('auth_token') || null
    } catch {
      return null
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content responses (like DELETE operations)
    if (response.status === 204) {
      if (!response.ok) {
        throw new TaskAPIError('Request failed', response.status, 'API_ERROR')
      }
      return undefined as T
    }

    const contentType = response.headers.get('content-type')
    
    if (!contentType?.includes('application/json')) {
      throw new TaskAPIError(
        'Invalid response format',
        response.status,
        'INVALID_RESPONSE_FORMAT'
      )
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          // Clear invalid tokens
          Cookies.remove('auth_token')
          Cookies.remove('auth_user')
          
          // Only redirect if not already on auth page
          if (!window.location.pathname.includes('/auth')) {
            setTimeout(() => {
              window.location.href = '/auth?mode=login'
            }, 100)
          }
        }
      }
      
      throw new TaskAPIError(
        data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data.code
      )
    }

    return data
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        },
        signal: controller.signal
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof TaskAPIError) {
        throw error
      }
      
      if (error.name === 'AbortError') {
        throw new TaskAPIError('Request timeout', 408, 'TIMEOUT')
      }
      
      throw new TaskAPIError(
        error instanceof Error ? error.message : 'Network error occurred',
        0,
        'NETWORK_ERROR'
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async getTasks(params?: TaskQueryParams): Promise<{ tasks: Task[]; pagination: unknown }> {
    try {
      // Always include subtasks in the response
      const paramsWithSubtasks = {
        ...params,
        include: 'subtasks'
      }
      const searchParams = this.buildSearchParams(paramsWithSubtasks)
      const endpoint = `/tasks${searchParams ? `?${searchParams}` : '?include=subtasks'}`
      
      const data = await this.makeRequest<ApiResponse<Task>>(endpoint)
      
      return {
        tasks: data.tasks || [],
        pagination: data.pagination
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch tasks')
    }
  }

  private buildSearchParams(params?: TaskQueryParams): string {
    if (!params) return ''
    
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    return searchParams.toString()
  }

  async getTaskById(id: number): Promise<Task> {
    try {
      this.validateTaskId(id)
      
      // Include subtasks when fetching a single task
      const data = await this.makeRequest<ApiResponse<Task>>(`/tasks/${id}?include=subtasks`)
      
      if (!data.task) {
        throw new TaskAPIError('Task not found', 404, 'TASK_NOT_FOUND')
      }

      return data.task
    } catch (error) {
      throw this.handleError(error, `Failed to fetch task with ID ${id}`)
    }
  }

  async createTask(taskData: CreateTaskInput): Promise<Task> {
    try {
      this.validateCreateTaskInput(taskData)
      
      const data = await this.makeRequest<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify(this.sanitizeTaskInput(taskData))
      })
      
      if (!data.task) {
        throw new TaskAPIError('Failed to create task', 500, 'CREATE_FAILED')
      }

      return data.task
    } catch (error) {
      throw this.handleError(error, 'Failed to create task')
    }
  }

  async updateTask(id: number, updates: TaskUpdateInput): Promise<Task> {
    try {
      this.validateTaskId(id)
      this.validateUpdateTaskInput(updates)
      
      const data = await this.makeRequest<ApiResponse<Task>>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(this.sanitizeTaskInput(updates))
      })
      
      if (!data.task) {
        throw new TaskAPIError('Failed to update task', 500, 'UPDATE_FAILED')
      }

      return data.task
    } catch (error) {
      throw this.handleError(error, `Failed to update task with ID ${id}`)
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      this.validateTaskId(id)
      
      await this.makeRequest<void>(`/tasks/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw this.handleError(error, `Failed to delete task with ID ${id}`)
    }
  }

  private validateTaskId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new TaskAPIError('Invalid task ID', 400, 'INVALID_TASK_ID')
    }
  }

  private validateCreateTaskInput(taskData: CreateTaskInput): void {
    if (!taskData.title || typeof taskData.title !== 'string' || !taskData.title.trim()) {
      throw new TaskAPIError('Task title is required', 400, 'INVALID_INPUT')
    }

    if (taskData.title.length > 255) {
      throw new TaskAPIError('Task title cannot exceed 255 characters', 400, 'INVALID_INPUT')
    }

    // Only require assignee for parent tasks (subtasks don't need assignees)
    if (!taskData.parentId && (!taskData.assigneeId || taskData.assigneeId <= 0)) {
      throw new TaskAPIError('Valid assignee is required for parent tasks', 400, 'INVALID_INPUT')
    }

    if (taskData.parentId !== undefined && taskData.parentId <= 0) {
      throw new TaskAPIError('Invalid parent task ID', 400, 'INVALID_INPUT')
    }
  }

  private validateUpdateTaskInput(updates: TaskUpdateInput): void {
    if (Object.keys(updates).length === 0) {
      throw new TaskAPIError('At least one field must be updated', 400, 'INVALID_INPUT')
    }

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || !updates.title.trim()) {
        throw new TaskAPIError('Task title cannot be empty', 400, 'INVALID_INPUT')
      }
      
      if (updates.title.length > 255) {
        throw new TaskAPIError('Task title cannot exceed 255 characters', 400, 'INVALID_INPUT')
      }
    }
  }

  private sanitizeTaskInput(input: CreateTaskInput | TaskUpdateInput): CreateTaskInput | TaskUpdateInput {
    const sanitized = { ...input }
    
    if (sanitized.title) {
      sanitized.title = sanitized.title.trim()
    }
    
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim()
    }
    
    return sanitized
  }

  private handleError(error: unknown, context: string): Error {
    if (error instanceof TaskAPIError) {
      return error
    }
    
    if (error instanceof Error) {
      return new TaskAPIError(`${context}: ${error.message}`, 0, 'UNKNOWN_ERROR')
    }
    
    return new TaskAPIError(`${context}: Unknown error occurred`, 0, 'UNKNOWN_ERROR')
  }
}

export const taskAPI = new TaskAPI()
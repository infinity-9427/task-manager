import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  ApiResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';

class TaskService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {})
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
      
      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get from cookies first
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Fallback to localStorage
    return localStorage.getItem('accessToken');
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.makeRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return this.makeRequest<Task[]>('/tasks');
  }

  async getTaskById(id: number): Promise<Task> {
    return this.makeRequest<Task>(`/tasks/${id}`);
  }

  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    return this.makeRequest<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTask(id: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // Additional utility methods for task management
  async getTasksByStatus(status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.status === status);
  }

  async getTasksByPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.priority === priority);
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.assignedToId === userId);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    const now = new Date();
    return allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'COMPLETED'
    );
  }

  async searchTasks(query: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return allTasks.filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description?.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async completeTask(id: number): Promise<Task> {
    return this.updateTask(id, { 
      status: 'COMPLETED', 
      completionPercentage: 100 
    });
  }

  async startTask(id: number): Promise<Task> {
    return this.updateTask(id, { status: 'IN_PROGRESS' });
  }

  async updateTaskProgress(id: number, percentage: number): Promise<Task> {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const status = clampedPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS';
    
    return this.updateTask(id, { 
      completionPercentage: clampedPercentage,
      status
    });
  }
}

// Create and export singleton instance
export const taskService = new TaskService();
export default taskService;

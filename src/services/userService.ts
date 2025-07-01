import { 
  User,
  ApiResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'MEMBER' | 'ADMIN' | 'MODERATOR';
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'MEMBER' | 'ADMIN' | 'MODERATOR';
  isActive?: boolean;
}

class UserService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    // Primary: Use external API at localhost:3200
    const externalUrl = `${API_BASE_URL}/api${endpoint}`;
    
    try {
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {})
        },
        ...options
      };

      const response = await fetch(externalUrl, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // If external API fails, try local Next.js API routes as fallback
      console.warn('External API unavailable, using local mock API:', error);
      
      const localUrl = `/api${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {})
        },
        ...options
      };

      const response = await fetch(localUrl, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    }
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

  async getUserById(id: number): Promise<User> {
    return this.makeRequest<User>(`/users/${id}`);
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.makeRequest<{ users: User[]; pagination: any }>('/users');
    return response.users || response as any; // Handle both formats
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return this.makeRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    return this.makeRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Utility methods
  async searchUsers(query: string): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(query.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getUsersByRole(role: 'MEMBER' | 'ADMIN' | 'MODERATOR'): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => user.role === role);
  }

  async getActiveUsers(): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => user.isActive);
  }

  async getOnlineUsers(): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => user.isOnline);
  }
}

// Create and export singleton instance
export const userService = new UserService();
export default userService;

// Export types for use in components
export type { CreateUserRequest, UpdateUserRequest };

import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  User,
  ApiResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';

class AuthService {
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
        // Clear tokens on 401 to prevent retry loops
        this.clearTokens();
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

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production';
    document.cookie = `accessToken=${accessToken}; expires=${new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;
    document.cookie = `refreshToken=${refreshToken}; expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;
    document.cookie = `authToken=${accessToken}; expires=${new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;
    
    // Fallback to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    // Clear cookies
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.accessToken && response.refreshToken) {
      this.setTokens(response.accessToken, response.refreshToken);
      
      // Also set username cookie
      const isProduction = process.env.NODE_ENV === 'production';
      document.cookie = `username=${response.user.username}; expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;
      localStorage.setItem('username', response.user.username);
    }
    
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.accessToken && response.refreshToken) {
      this.setTokens(response.accessToken, response.refreshToken);
      
      // Also set username cookie
      const isProduction = process.env.NODE_ENV === 'production';
      document.cookie = `username=${response.user.username}; expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;
      localStorage.setItem('username', response.user.username);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.makeRequest<{ user: User }>('/auth/me');
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' ? 
      localStorage.getItem('refreshToken') : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.makeRequest<AuthResponse>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ token: refreshToken })
    });
    
    if (response.accessToken && response.refreshToken) {
      this.setTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest<ApiResponse>('/auth/logout', {
        method: 'POST'
      });
      return response;
    } finally {
      // Always clear tokens locally, even if API call fails
      this.clearTokens();
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getStoredUsername(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try cookies first
    const cookies = document.cookie.split(';');
    const usernameCookie = cookies.find(c => c.trim().startsWith('username='));
    if (usernameCookie) {
      return usernameCookie.split('=')[1];
    }
    
    // Fallback to localStorage
    return localStorage.getItem('username');
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;

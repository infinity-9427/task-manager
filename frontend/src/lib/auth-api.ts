import { LoginFormData, RegisterFormData } from './auth-schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  token: string;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
  requestId?: string;
  path?: string;
  errors?: Array<Record<string, string[]>>;
}

export class AuthApiError extends Error {
  public readonly status: number;
  public readonly errors?: Array<Record<string, string[]>>;
  public readonly apiError?: ApiError;
  public readonly timestamp: string;

  constructor(
    message: string,
    status: number,
    errors?: Array<Record<string, string[]>>,
    apiError?: ApiError
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.errors = errors;
    this.apiError = apiError;
    this.timestamp = new Date().toISOString();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthApiError.prototype);
  }

  // Proper serialization for console.log and error tracking
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      errors: this.errors,
      apiError: this.apiError,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  // CRITICAL: Override toString to prevent [object Object]
  toString(): string {
    return `${this.name}: ${this.getUserMessage()} (Status: ${this.status})`;
  }

  // CRITICAL: Override valueOf to prevent [object Object]
  valueOf(): string {
    return this.getUserMessage();
  }

  // Get user-friendly error message
  getUserMessage(): string {
    // Priority: specific message > API error message > generic message
    if (this.apiError?.message) {
      return this.apiError.message;
    }
    
    if (this.message && this.message !== 'AuthApiError') {
      return this.message;
    }

    // Status-specific fallback messages
    switch (this.status) {
      case 400:
        return 'Invalid credentials or request data. Please check your input and try again.';
      case 401:
        return 'Invalid email or password. Please try again.';
      case 403:
        return 'Access denied. Your account may be suspended.';
      case 404:
        return 'Service not found. Please try again later.';
      case 409:
        return 'This email address is already registered. Please use a different email or try logging in.';
      case 429:
        return 'Too many attempts. Please wait a moment before trying again.';
      case 500:
        return 'Server error. Please try again in a few moments.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Get validation errors for form fields
  getFieldErrors(): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    
    if (this.errors && Array.isArray(this.errors)) {
      this.errors.forEach((errorObj) => {
        if (errorObj && typeof errorObj === 'object') {
          Object.entries(errorObj).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0];
            }
          });
        }
      });
    }
    
    return fieldErrors;
  }
}

// Safe error parsing utility
const safeParseError = async (response: Response): Promise<ApiError | null> => {
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    const errorData = JSON.parse(text);
    return errorData as ApiError;
  } catch (parseError) {
    console.warn('Failed to parse error response:', parseError);
    return null;
  }
};

// Safe response parsing utility
const safeParseResponse = async <T>(response: Response): Promise<T> => {
  try {
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response received');
    }
    
    return JSON.parse(text) as T;
  } catch (parseError) {
    console.error('Failed to parse response:', parseError);
    throw new Error('Invalid response format received from server');
  }
};

// Network error handler
const handleNetworkError = (error: unknown, operation: string): never => {
  console.error(`Network error during ${operation}:`, error);
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new AuthApiError(
      'Unable to connect to the server. Please check your internet connection and try again.',
      0 // Network error
    );
  }
  
  throw new AuthApiError(
    `Network error occurred during ${operation}. Please try again.`,
    0
  );
};

export const authApi = {
  async login(data: LoginFormData): Promise<AuthResponse> {
    try {
      // Input validation
      if (!data?.email?.trim()) {
        throw new AuthApiError('Email is required', 400);
      }
      
      if (!data?.password?.trim()) {
        throw new AuthApiError('Password is required', 400);
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password
        }),
      });

      if (!response.ok) {
        const errorData = await safeParseError(response);
        
        throw new AuthApiError(
          errorData?.error || errorData?.message || 'Login failed',
          response.status,
          errorData?.errors,
          errorData || undefined
        );
      }

      return await safeParseResponse<AuthResponse>(response);
      
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }
      
      handleNetworkError(error, 'login');
    }
  },

  async register(data: Omit<RegisterFormData, 'confirmPassword'>): Promise<AuthResponse> {
    try {
      // Input validation
      if (!data?.email?.trim()) {
        throw new AuthApiError('Email is required', 400);
      }
      
      if (!data?.name?.trim()) {
        throw new AuthApiError('Name is required', 400);
      }
      
      if (!data?.password?.trim()) {
        throw new AuthApiError('Password is required', 400);
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          name: data.name.trim(),
          password: data.password
        }),
      });

      if (!response.ok) {
        const errorData = await safeParseError(response);
        
        throw new AuthApiError(
          errorData?.error || errorData?.message || 'Registration failed',
          response.status,
          errorData?.errors,
          errorData || undefined
        );
      }

      return await safeParseResponse<AuthResponse>(response);
      
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }
      
      handleNetworkError(error, 'registration');
    }
  },

  // Health check utility for debugging
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await safeParseResponse(response);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};
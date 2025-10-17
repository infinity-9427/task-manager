import { toast } from 'sonner';
import { getErrorMessage } from './error-utils';

/**
 * Enterprise-grade toast utilities that prevent [object Object] messages
 * McKinsey standards: No user should ever see technical error objects
 */

// Safe string validation utility
const sanitizeMessage = (message: unknown): string => {
  if (typeof message === 'string' && message.trim() && message !== '[object Object]') {
    return message;
  }
  
  if (typeof message === 'object' && message !== null) {
    // Try to extract meaningful information
    const obj = message as any;
    if (obj.message && typeof obj.message === 'string' && obj.message !== '[object Object]') {
      return obj.message;
    }
    if (obj.error && typeof obj.error === 'string' && obj.error !== '[object Object]') {
      return obj.error;
    }
  }
  
  return 'An error occurred';
};

interface ToastOptions {
  description?: unknown;
  duration?: number;
  action?: React.ReactElement;
}

export const safeToast = {
  success: (message: unknown, options?: ToastOptions) => {
    const safeMessage = sanitizeMessage(message);
    const safeDescription = options?.description ? sanitizeMessage(options.description) : undefined;
    
    return toast.success(safeMessage, {
      ...options,
      description: safeDescription,
    });
  },

  error: (message: unknown, options?: ToastOptions) => {
    const safeMessage = sanitizeMessage(message);
    const safeDescription = options?.description ? sanitizeMessage(options.description) : undefined;
    
    return toast.error(safeMessage, {
      ...options,
      description: safeDescription,
    });
  },

  warning: (message: unknown, options?: ToastOptions) => {
    const safeMessage = sanitizeMessage(message);
    const safeDescription = options?.description ? sanitizeMessage(options.description) : undefined;
    
    return toast.warning(safeMessage, {
      ...options,
      description: safeDescription,
    });
  },

  info: (message: unknown, options?: ToastOptions) => {
    const safeMessage = sanitizeMessage(message);
    const safeDescription = options?.description ? sanitizeMessage(options.description) : undefined;
    
    return toast.info(safeMessage, {
      ...options,
      description: safeDescription,
    });
  },

  // Specialized error toast that uses our error utilities
  apiError: (error: unknown, title?: string) => {
    const userMessage = getErrorMessage(error);
    const safeTitle = title ? sanitizeMessage(title) : 'Operation Failed';
    
    console.error('API Error:', error); // Log for debugging
    
    return toast.error(safeTitle, {
      description: userMessage,
      duration: 5000, // Longer duration for error messages
    });
  },

  // Authentication-specific error handler
  authError: (error: unknown, isLogin: boolean = true) => {
    const userMessage = getErrorMessage(error);
    const title = isLogin ? 'Login Failed' : 'Registration Failed';
    
    console.error('Auth Error:', error); // Log for debugging
    
    return toast.error(title, {
      description: userMessage,
      duration: 5000,
    });
  },

  // Network error handler
  networkError: (error?: unknown) => {
    console.error('Network Error:', error);
    
    return toast.error('Connection Error', {
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      duration: 6000,
    });
  },

  // Validation error handler
  validationError: (fieldErrors: Record<string, string>, generalMessage?: string) => {
    const errorCount = Object.keys(fieldErrors).length;
    const message = generalMessage || 'Please check your input';
    const description = errorCount === 1 
      ? Object.values(fieldErrors)[0]
      : `${errorCount} fields need your attention`;
    
    return toast.error(message, {
      description: sanitizeMessage(description),
      duration: 4000,
    });
  }
};

// Legacy toast functions that are safe by default
export const showSuccessToast = (message: unknown, description?: unknown) => {
  return safeToast.success(message, { description });
};

export const showErrorToast = (message: unknown, description?: unknown) => {
  return safeToast.error(message, { description });
};

export const showApiErrorToast = (error: unknown, title?: string) => {
  return safeToast.apiError(error, title);
};

export const showAuthErrorToast = (error: unknown, isLogin: boolean = true) => {
  return safeToast.authError(error, isLogin);
};

// Development-only toast for debugging (removed in production)
export const showDebugToast = (data: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    const message = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    return toast.info('Debug Info', {
      description: message,
      duration: 10000,
    });
  }
};

export default safeToast;
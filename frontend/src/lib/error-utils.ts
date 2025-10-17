import { AuthApiError } from './auth-api';

// Enhanced error types for better type safety
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
  status?: number;
  timestamp?: string;
  requestId?: string;
  path?: string;
  errors?: Array<Record<string, string[]>>;
}

export interface NetworkError extends Error {
  code?: string;
  errno?: number;
}

// User-friendly error messages mapping
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  ABORT_ERROR: 'Request was cancelled. Please try again.',
  
  // HTTP status errors
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in again.',
  403: 'Access denied. You do not have permission to perform this action.',
  404: 'Resource not found. It may have been deleted or moved.',
  409: 'Conflict detected. The resource may have been modified by someone else.',
  422: 'Validation failed. Please check your input and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Server error occurred. Please try again in a few moments.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timed out. Please try again later.',
  
  // Fallbacks
  CLIENT_ERROR: 'Client error occurred. Please check your request.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;

/**
 * Enhanced utility to extract user-friendly error messages from various error types
 * ENTERPRISE GRADE: Absolutely prevents [object Object] from appearing to users
 */
export function getErrorMessage(error: unknown): string {
  try {
    // Handle null/undefined
    if (!error) {
      return ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    // ENTERPRISE GRADE: Prevent [object Object] at all costs
    if (typeof error === 'object' && (error.toString() === '[object Object]' || String(error) === '[object Object]')) {
      console.warn('Detected [object Object] error, applying enterprise fallback handling');
      
      // Try to extract meaningful information from the object
      const errorObj = error as any;
      
      // Check for getUserMessage method first (our AuthApiError)
      if (typeof errorObj.getUserMessage === 'function') {
        try {
          const message = errorObj.getUserMessage();
          if (typeof message === 'string' && message.trim()) {
            return message;
          }
        } catch (e) {
          console.warn('Error calling getUserMessage:', e);
        }
      }
      
      if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message !== '[object Object]') {
        return errorObj.message;
      }
      if (errorObj.error && typeof errorObj.error === 'string' && errorObj.error !== '[object Object]') {
        return errorObj.error;
      }
      if (errorObj.status) {
        return ERROR_MESSAGES[errorObj.status as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
      }
      
      return ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    // Handle AuthApiError specifically (check by name for reliability)
    const isAuthApiError = error && 
      typeof error === 'object' && 
      (error.constructor?.name === 'AuthApiError' || 
       (error as any).name === 'AuthApiError' ||
       typeof (error as any).getUserMessage === 'function');

    if (isAuthApiError) {
      try {
        const message = (error as any).getUserMessage?.();
        if (typeof message === 'string' && message.trim() && message !== '[object Object]') {
          return message;
        }
      } catch (getUserMessageError) {
        console.warn('Error calling getUserMessage:', getUserMessageError);
      }
    }
    
    // Handle custom errors with getUserMessage method
    if (typeof error === 'object' && 'getUserMessage' in error && typeof (error as any).getUserMessage === 'function') {
      try {
        const message = (error as any).getUserMessage();
        if (typeof message === 'string' && message.trim() && message !== '[object Object]') {
          return message;
        }
      } catch (getUserMessageError) {
        console.warn('Error calling getUserMessage on custom error:', getUserMessageError);
      }
    }
    
    // Handle API errors with status codes
    if (typeof error === 'object') {
      const apiError = error as ApiErrorResponse;
      
      // Get status code from various possible properties
      const status = apiError.status || apiError.statusCode;
      
      if (status && typeof status === 'number') {
        // Return specific status message if available
        if (status in ERROR_MESSAGES) {
          const statusMessage = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
          // If API provides a specific message, use it; otherwise use our friendly message
          if (apiError.message && typeof apiError.message === 'string' && apiError.message.trim()) {
            return apiError.message;
          }
          return statusMessage;
        }
        
        // Handle status ranges
        if (status >= 400 && status < 500) {
          return apiError.message || ERROR_MESSAGES.CLIENT_ERROR;
        }
        
        if (status >= 500) {
          return apiError.message || ERROR_MESSAGES.SERVER_ERROR;
        }
      }
      
      // Check for message properties with strict [object Object] prevention
      if (apiError.message && typeof apiError.message === 'string' && 
          apiError.message.trim() && apiError.message !== '[object Object]') {
        return apiError.message;
      }
      
      if (apiError.error && typeof apiError.error === 'string' && 
          apiError.error.trim() && apiError.error !== '[object Object]') {
        return apiError.error;
      }
    }
    
    // Handle Error instances
    if (error instanceof Error) {
      // Network-related errors
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }
      
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      }
      
      if (error.message.includes('aborted') || error.message.includes('cancelled')) {
        return ERROR_MESSAGES.ABORT_ERROR;
      }
      
      // CORS errors
      if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
        return 'Cross-origin request blocked. Please contact support if this continues.';
      }
      
      // Return the error message if it's meaningful
      if (error.message.trim() && !error.message.includes('[object Object]')) {
        return error.message;
      }
    }
    
    // Handle string errors
    if (typeof error === 'string' && error.trim() && !error.includes('[object Object]')) {
      return error;
    }
    
    // Fallback for unhandled cases
    return ERROR_MESSAGES.UNKNOWN_ERROR;
    
  } catch (extractionError) {
    console.warn('Error extracting error message:', extractionError);
    return 'An error occurred while processing your request.';
  }
}

/**
 * Extract field validation errors from API responses
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  try {
    // Handle AuthApiError
    if (error instanceof AuthApiError) {
      return error.getFieldErrors();
    }
    
    // Handle API errors with validation errors
    if (error && typeof error === 'object') {
      const apiError = error as ApiErrorResponse;
      
      if (apiError.errors && Array.isArray(apiError.errors)) {
        apiError.errors.forEach((errorObj) => {
          if (errorObj && typeof errorObj === 'object') {
            Object.entries(errorObj).forEach(([field, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                fieldErrors[field] = messages[0];
              }
            });
          }
        });
      }
    }
  } catch (extractionError) {
    console.warn('Error extracting field errors:', extractionError);
  }
  
  return fieldErrors;
}

/**
 * Check if an error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('NETWORK_ERROR');
  }
  
  if (typeof error === 'object') {
    const networkError = error as NetworkError;
    return networkError.code === 'NETWORK_ERROR' || 
           networkError.errno === -1 ||
           (networkError as any).status === 0;
  }
  
  return false;
}

/**
 * Check if an error is an authentication/authorization issue
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    const status = apiError.status || apiError.statusCode;
    return status === 401 || status === 403;
  }
  
  return false;
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: unknown, attemptCount: number = 0, maxRetries: number = 3): boolean {
  if (attemptCount >= maxRetries) return false;
  
  // Don't retry auth errors or client errors
  if (isAuthError(error)) return false;
  
  if (typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    const status = apiError.status || apiError.statusCode;
    
    // Don't retry 4xx errors (except 408, 429)
    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
    
    // Retry 5xx errors and network errors
    if (status && status >= 500) return true;
  }
  
  // Retry network errors
  if (isNetworkError(error)) return true;
  
  return false;
}

/**
 * Safe array mapping utility to prevent crashes on malformed data
 */
export function safeMap<T, U>(
  array: T[] | null | undefined, 
  mapFn: (item: T, index: number) => U
): U[] {
  if (!Array.isArray(array)) {
    console.warn('safeMap: Input is not an array, returning empty array');
    return [];
  }
  
  try {
    return array
      .filter((item): item is T => item != null) // Remove null/undefined items
      .map(mapFn);
  } catch (error) {
    console.error('Error in safeMap:', error);
    return [];
  }
}

/**
 * Safe object access utility with fallback
 */
export function safeGet<T>(
  obj: any, 
  path: string, 
  fallback: T
): T {
  try {
    if (!obj || typeof obj !== 'object') {
      return fallback;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return fallback;
      }
      current = current[key];
    }
    
    return current != null ? current : fallback;
  } catch (error) {
    console.warn(`Error accessing path "${path}":`, error);
    return fallback;
  }
}
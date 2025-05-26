import { useState } from 'react';

interface UseFetcherOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

interface FetchResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Simplified fetch hook for API requests
 */
export function useFetcher<T = any>(options: UseFetcherOptions = {}) {
  const [state, setState] = useState<FetchResponse<T>>({
    data: null,
    error: null,
    isLoading: false
  });

  const baseUrl = options.baseUrl  || '';

  /**
   * Builds the complete URL from base URL and endpoint
   */
  const buildUrl = (endpoint: string): string => {
    // Handle complete URLs
    if (endpoint.startsWith('http')) return endpoint;
    
    // Normalize parts
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    return `${base}/${path}`;
  };

  /**
   * Makes an API request
   */
  const request = async (
    endpoint: string,
    method: string,
    body?: any
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const url = buildUrl(endpoint);
      
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };
      
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMessage = errorJson.message;
        } catch {} // Ignore JSON parse errors
        
        throw new Error(errorMessage);
      }
      
      if (response.status === 204) {
        setState(prev => ({ ...prev, data: null, isLoading: false }));
        return null;
      }
      
      const data = await response.json();
      setState({ data, isLoading: false, error: null });
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return null;
    }
  };

  // Simplified API methods
  return {
    get: (endpoint: string) => request(endpoint, 'GET'),
    post: <D extends object>(endpoint: string, data: D) => request(endpoint, 'POST', data),
    put: <D extends object>(endpoint: string, data: D) => request(endpoint, 'PUT', data),
    delete: (endpoint: string) => request(endpoint, 'DELETE'),
    patch: <D extends object>(endpoint: string, data: D) => request(endpoint, 'PATCH', data),
    ...state
  };
}
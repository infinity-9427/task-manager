"use client"
import { useState } from 'react';
import { z } from 'zod';
import clsx from 'clsx';
import Cookies from 'js-cookie';
import { useFetcher } from '../app/_hooks/useFetcher';
import { useAuth } from '@/app/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof loginSchema>;

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Use the fetcher hook for API requests
  const { post, error: fetchError } = useFetcher<AuthResponse>({ baseUrl: process.env.NEXT_PUBLIC_API_URL });
  
  if (!isOpen) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const path = error.path[0] as string;
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }
    
    // Send login request to API
    setIsLoading(true);
    try {
      const response = await post('/auth/login', {
        username: formData.username,
        password: formData.password
      });
      
      if (response) {
        // Store tokens securely in cookies
        Cookies.set('accessToken', response.accessToken, { 
          expires: 1, // 1 day 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        Cookies.set('refreshToken', response.refreshToken, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        // Set authToken for middleware
        Cookies.set('authToken', response.accessToken, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'strict'
        });
        
        // Store username in cookie
        Cookies.set('username', formData.username, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' 
        });
        
        // Update auth context
        login(formData.username);
        
        // Call onLogin callback
        onLogin(formData.username, formData.password);
      } else {
        setErrors({
          auth: fetchError || 'Authentication failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({
        auth: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Purple Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to access your tasks
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show general auth error if present */}
            {errors.auth && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {errors.auth}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className={clsx(
                  "w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
                  errors.username 
                    ? "border-red-500 dark:border-red-400" 
                    : "border-gray-300 dark:border-gray-600"
                )}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={clsx(
                    "w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
                    "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
                    errors.password 
                      ? "border-red-500 dark:border-red-400" 
                      : "border-gray-300 dark:border-gray-600"
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full py-3 px-4 rounded-lg text-white font-medium transition-all shadow-md",
                  "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
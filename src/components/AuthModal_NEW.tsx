"use client"
import { useState } from 'react';
import { z } from 'zod';
import clsx from 'clsx';
import { authService } from '@/services';
import { useAuth } from '@/app/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  if (!isOpen) return null;

  const currentFormData = isLoginMode ? loginFormData : registerFormData;
  const setCurrentFormData = isLoginMode ? setLoginFormData : setRegisterFormData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (isLoginMode) {
      setLoginFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setRegisterFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
    
    if (isLoginMode) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  const handleLogin = async () => {
    // Validate form
    const result = loginSchema.safeParse(loginFormData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const path = error.path[0] as string;
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await authService.login({
        username: loginFormData.username,
        password: loginFormData.password
      });
      
      // Update auth context
      login(response.user.username);
      
      // Call onLogin callback
      onLogin(loginFormData.username, loginFormData.password);
      
      // Close modal
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrors({ auth: errorMessage });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate form
    const result = registerSchema.safeParse(registerFormData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const path = error.path[0] as string;
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await authService.register({
        username: registerFormData.username,
        email: registerFormData.email,
        password: registerFormData.password,
        firstName: registerFormData.firstName || undefined,
        lastName: registerFormData.lastName || undefined
      });
      
      // Update auth context
      login(response.user.username);
      
      // Call onRegister callback
      onRegister(registerFormData.username, registerFormData.password);
      
      // Close modal
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setErrors({ auth: errorMessage });
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setLoginFormData({ username: '', password: '' });
    setRegisterFormData({ username: '', email: '', password: '', firstName: '', lastName: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              {isLoginMode ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isLoginMode ? 'Sign in to access your tasks' : 'Join us and start managing your tasks'}
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
                value={currentFormData.username}
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

            {!isLoginMode && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={registerFormData.email}
                    onChange={handleChange}
                    className={clsx(
                      "w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
                      "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
                      errors.email 
                        ? "border-red-500 dark:border-red-400" 
                        : "border-gray-300 dark:border-gray-600"
                    )}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={registerFormData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={registerFormData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  required
                  value={currentFormData.password}
                  onChange={handleChange}
                  className={clsx(
                    "w-full px-4 py-3 pr-12 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
                    "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
                    errors.password 
                      ? "border-red-500 dark:border-red-400" 
                      : "border-gray-300 dark:border-gray-600"
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
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
                    {isLoginMode ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  isLoginMode ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  RiUser3Line, 
  RiLockPasswordLine, 
  RiMailLine, 
  RiEyeLine, 
  RiEyeOffLine,
  RiLoginBoxLine,
  RiUserAddLine,
  RiLoader4Line
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from '@/lib/auth-schemas';
import { authApi, AuthApiError, AuthResponse } from '@/lib/auth-api';
import { useAuth } from '@/contexts/auth-context';
import { safeToast } from '@/lib/toast-utils';

export type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: () => void;
}

export default function AuthForm({ mode, onModeChange, onSuccess }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    setIsLoading(true);
    
    try {
      let response: AuthResponse;
      
      if (isLogin) {
        response = await authApi.login(data as LoginFormData);
        safeToast.success('Welcome back!', {
          description: `Successfully logged in as ${response?.user?.name || 'user'}`,
        });
      } else {
        const registerData = data as RegisterFormData;
        const { confirmPassword: _confirmPassword, ...submitData } = registerData;
        response = await authApi.register(submitData);
        safeToast.success('Account created successfully!', {
          description: `Welcome ${response?.user?.name || 'user'}! You're now logged in.`,
        });
      }

      // Validate response before proceeding
      if (!response?.user?.id || !response?.token) {
        throw new Error('Invalid response received from server');
      }

      // Update auth context
      login(response.user, response.token);
      
      // Reset form
      reset();
      
      // Call success callback
      onSuccess?.();
      
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      
      // Enterprise-grade error handling with multiple fallback strategies
      try {
        // Check for AuthApiError by multiple methods (more reliable than instanceof)
        const isAuthApiError = error && 
          typeof error === 'object' && 
          (error.constructor?.name === 'AuthApiError' || 
           (error as any).name === 'AuthApiError' ||
           typeof (error as any).getUserMessage === 'function');

        if (isAuthApiError) {
          const authError = error as AuthApiError;
          
          // Handle field validation errors with safe extraction
          let fieldErrors: Record<string, string> = {};
          
          try {
            fieldErrors = authError.getFieldErrors?.() || {};
          } catch (fieldErrorErr) {
            console.warn('Error getting field errors:', fieldErrorErr);
          }
          
          if (Object.keys(fieldErrors).length > 0) {
            // Set field-specific errors in the form
            Object.entries(fieldErrors).forEach(([field, message]) => {
              if (['email', 'password', 'name', 'confirmPassword'].includes(field)) {
                setError(field as keyof (LoginFormData | RegisterFormData), {
                  message: message || 'Invalid value',
                });
              }
            });
            
            // Show validation error toast
            safeToast.validationError(fieldErrors, 'Please check your input');
          } else {
            // Show authentication error using our safe toast utility
            safeToast.authError(error, isLogin);
          }
          return;
        }
        
        // For all other errors, use our safe toast utility
        safeToast.authError(error, isLogin);
        
      } catch (handlingError) {
        console.error('Critical error in error handling:', handlingError);
        
        // Ultimate enterprise-grade fallback - guaranteed to never show [object Object]
        safeToast.error(
          isLogin ? 'Login failed' : 'Registration failed',
          { description: 'An unexpected error occurred. Please try again.' }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    reset();
    onModeChange(isLogin ? 'register' : 'login');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
            {isLogin ? (
              <RiLoginBoxLine className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            ) : (
              <RiUserAddLine className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            {isLogin 
              ? 'Sign in to access your tasks and conversations'
              : 'Join our task management platform to get started'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Name field (register only) */}
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiUser3Line className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={`pl-10 ${errors && 'name' in errors && errors.name ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                  {...register('name')}
                />
              </div>
              {errors && 'name' in errors && errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMailLine className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiLockPasswordLine className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <RiEyeLine className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <RiEyeOffLine className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password field (register only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiLockPasswordLine className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className={`pl-10 pr-10 ${errors && 'confirmPassword' in errors && errors.confirmPassword ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <RiEyeLine className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <RiEyeOffLine className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors && 'confirmPassword' in errors && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RiLoader4Line className="w-5 h-5 animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {isLogin ? (
                  <RiLoginBoxLine className="w-5 h-5" />
                ) : (
                  <RiUserAddLine className="w-5 h-5" />
                )}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </Button>
        </form>

        {/* Mode Switch */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={handleModeSwitch}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              disabled={isLoading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
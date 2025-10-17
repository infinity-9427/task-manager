'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm, { AuthMode } from '@/components/auth-form';
import { useAuth } from '@/contexts/auth-context';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Get initial mode from URL params or default to login
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Update URL when mode changes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.replaceState({}, '', url.toString());
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/tasks'); // Redirect to tasks page
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    router.push('/tasks'); // Redirect to tasks page after successful auth
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm 
        mode={mode}
        onModeChange={handleModeChange}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
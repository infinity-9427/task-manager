"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { authService, socketService } from '@/services';
import type { User } from '@/types/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  user: User | null;
  login: (username: string) => void;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const refreshUserData = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      setUser(response.user);
      setUsername(response.user.username);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // If fetching user fails due to auth issues (401), logout
      if (error instanceof Error && (
        error.message.includes('401') || 
        error.message.includes('Invalid token') ||
        error.message.includes('Unauthorized')
      )) {
        await logout();
      }
    }
  };

  const checkAuthStatus = () => {
    const authToken = Cookies.get('authToken');
    const storedUsername = Cookies.get('username');
    
    const isAuth = !!authToken;
    setIsAuthenticated(isAuth);
    
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setUsername("");
    }

    // Update socket connection based on auth status
    if (isAuth) {
      socketService.updateToken(authToken);
      // Refresh user data when authenticated
      refreshUserData();
    } else {
      socketService.updateToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status periodically to handle token expiration
    const interval = setInterval(checkAuthStatus, 60000); // every minute
    
    return () => clearInterval(interval);
  }, []);

  const login = (username: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    
    // Update socket connection with new token
    const token = Cookies.get('authToken');
    if (token) {
      socketService.updateToken(token);
    }
    
    // Refresh user data after login
    refreshUserData();
  };

  const loginWithCredentials = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      
      // Tokens are automatically stored by authService
      setIsAuthenticated(true);
      setUsername(username);
      
      // Update socket connection with new token
      const token = Cookies.get('authToken');
      if (token) {
        socketService.updateToken(token);
      }
      
      // Refresh user data after login
      await refreshUserData();
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw to let the UI handle the error
    }
  };

  const logout = async () => {
    try {
      // Call API logout to invalidate tokens on server
      await authService.logout();
    } catch (error) {
      console.error('API logout failed:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local state
    setIsAuthenticated(false);
    setUsername("");
    setUser(null);
    
    // Disconnect socket
    socketService.updateToken(null);
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      username, 
      user,
      login, 
      logout, 
      checkAuthStatus,
      refreshUserData,
      loginWithCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount with comprehensive error handling
    const initializeAuth = async () => {
      try {
        const savedToken = Cookies.get('auth_token');
        const savedUser = Cookies.get('auth_user');

        if (savedToken?.trim() && savedUser?.trim()) {
          try {
            const parsedUser = JSON.parse(savedUser);
            
            // Validate parsed user data
            if (parsedUser?.id && parsedUser?.email && parsedUser?.name && 
                typeof parsedUser.id === 'number' && 
                typeof parsedUser.email === 'string' && 
                typeof parsedUser.name === 'string') {
              
              setToken(savedToken);
              setUser(parsedUser);
            } else {
              console.warn('Invalid user data structure in cookies:', parsedUser);
              logout();
            }
          } catch (parseError) {
            console.error('Error parsing saved user data:', parseError);
            logout();
          }
        } else if (savedToken || savedUser) {
          // Partial data exists, clean up
          console.warn('Incomplete auth data in cookies, cleaning up');
          logout();
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User, authToken: string) => {
    try {
      // Validate input parameters
      if (!userData?.id || !userData?.email || !userData?.name || !authToken?.trim()) {
        console.error('Invalid login data provided:', { userData, tokenExists: !!authToken });
        throw new Error('Invalid user data or token provided');
      }

      console.log('AuthContext: Logging in user:', userData.email);
      console.log('AuthContext: Token received:', authToken.substring(0, 20) + '...');

      setUser(userData);
      setToken(authToken);
      
      // Save to cookies with 7 day expiration (same as backend JWT)
      try {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = { 
          expires: 7, 
          secure: isProduction, 
          sameSite: 'strict' as const 
        };
        Cookies.set('auth_token', authToken, cookieOptions);
        Cookies.set('auth_user', JSON.stringify(userData), cookieOptions);
        
        console.log('AuthContext: Cookies saved successfully');
        
        // Verify cookies were set
        const savedToken = Cookies.get('auth_token');
        console.log('AuthContext: Verified saved token:', savedToken?.substring(0, 20) + '...');
      } catch (cookieError) {
        console.error('Error saving auth data to cookies:', cookieError);
        // Continue without cookies - user will need to re-login on refresh
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      setUser(null);
      setToken(null);
      
      // Remove from cookies with error handling
      try {
        Cookies.remove('auth_token');
        Cookies.remove('auth_user');
      } catch (cookieError) {
        console.warn('Error removing auth cookies:', cookieError);
        // Continue with logout even if cookie removal fails
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure state is cleared even if there's an error
      setUser(null);
      setToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
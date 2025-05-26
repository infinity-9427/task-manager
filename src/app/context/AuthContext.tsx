"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from 'js-cookie';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (username: string) => void;
  logout: () => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  const checkAuthStatus = () => {
    const authToken = Cookies.get('authToken');
    const storedUsername = Cookies.get('username');
    
    setIsAuthenticated(!!authToken);
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setUsername("");
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
  };

  const logout = () => {
    // Clear auth cookies
    Cookies.remove('authToken');
    Cookies.remove('username');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    
    setIsAuthenticated(false);
    setUsername("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, checkAuthStatus }}>
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
"use client";

/**
 * SecureShare Auth Context
 * =========================
 * Provides authentication state across the entire application.
 * Handles login, register, logout, and auto-restore session from localStorage.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  LoginResponse,
  loginUser,
  registerUser,
  getCurrentUser,
  removeToken,
  setToken,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored JWT token on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem("secureshare_token");
        if (token) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch {
        // Token is invalid or expired — clear it
        removeToken();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await registerUser(username, email, password);
    },
    []
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

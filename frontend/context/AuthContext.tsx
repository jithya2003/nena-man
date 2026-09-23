/**
 * nena-man · frontend/context/AuthContext.tsx
 * Global Authentication Context & Hook.
 * Manages active user profile, role (child/parent/teacher), and session persistence.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RegisterData } from '@/types';
import { AppStorage } from '@/utils/storage';
import { authService } from '@/services/authService';

const STORAGE_KEYS = {
  USER: '@nena_man_auth_user',
  TOKEN: '@nena_man_auth_token',
};

export interface LoginResult {
  success: boolean;
  needsVerification?: boolean;
  email?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<{ success: boolean; email: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setUserSession: (user: UserProfile, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore persisted session on startup
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedUser = await AppStorage.getItem(STORAGE_KEYS.USER);
        const storedToken = await AppStorage.getItem(STORAGE_KEYS.TOKEN);

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (
    identifier: string,
    password?: string,
    role: UserRole = 'child'
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await authService.login(identifier, password, role);

      // Block unverified parent/teacher accounts from establishing an active session
      const isAdultAccount = res.user.role === 'parent' || res.user.role === 'teacher';
      if (isAdultAccount && !res.user.emailVerified) {
        setIsLoading(false);
        return {
          success: false,
          needsVerification: true,
          email: res.user.email,
          role: res.user.role,
        };
      }

      setUser(res.user);
      setToken(res.token);

      await AppStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
      await AppStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      return { success: true, role: res.user.role };
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; email: string }> => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      // Do NOT persist session yet — user must verify email first
      return { success: true, email: data.email };
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      await AppStorage.removeItem(STORAGE_KEYS.USER);
      await AppStorage.removeItem(STORAGE_KEYS.TOKEN);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserSession = async (userProfile: UserProfile, authToken: string) => {
    setUser(userProfile);
    setToken(authToken);
    await AppStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    await AppStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      AppStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        isAuthenticated: !!user,
        isEmailVerified: user?.emailVerified ?? false,
        login,
        register,
        logout,
        switchRole,
        setUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

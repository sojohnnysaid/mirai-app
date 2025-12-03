'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { KratosSession, KratosIdentity } from '@/lib/kratos/types';
import { getSession, createLogoutFlow, performLogout } from '@/lib/kratos';
import { AUTH_COOKIES } from '@/lib/auth.config';

interface AuthContextValue {
  // Session state
  session: KratosSession | null;
  user: KratosIdentity | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<KratosSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionData = await getSession();
      setSession(sessionData);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : 'Failed to check session');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setSession(null);
    setError(null);
    // Clear session cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${AUTH_COOKIES.SESSION_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const flow = await createLogoutFlow();
      await performLogout(flow.logout_token);
      clearAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      // Still clear local state even if logout request fails
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const value: AuthContextValue = {
    session,
    user: session?.identity ?? null,
    isAuthenticated: !!session?.active,
    isLoading,
    isInitialized,
    error,
    checkSession,
    logout,
    clearAuth,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export types for convenience
export type { KratosSession, KratosIdentity };

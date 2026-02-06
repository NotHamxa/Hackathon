"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

export interface AuthContextValue {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  logout: () => {},
});

const STORAGE_KEY = "vericampus_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTokenState(stored);
    setHydrated(true);
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem(STORAGE_KEY, t);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  // Don't render until hydrated to avoid flicker
  if (!hydrated) return null;

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

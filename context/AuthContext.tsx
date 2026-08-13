"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_COOKIE_NAME, getSleepUserFromToken, type SleepUser } from "@/lib/auth";

type AuthState = {
  isLoading: boolean;
  token: string | null;
  user: SleepUser | null;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readCookie(name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))?.[1] ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SleepUser | null>(null);

  useEffect(() => {
    const currentToken =
      readCookie(AUTH_COOKIE_NAME) ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");

    if (currentToken) {
      const decodedUser = getSleepUserFromToken(currentToken);
      setToken(currentToken);
      setUser(decodedUser);
      // Les modules de prescription existants attendent ces clés.
      localStorage.setItem("access_token", currentToken);
      localStorage.setItem("auth_token", currentToken);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ isLoading, token, user, logout }),
    [isLoading, token, user, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return context;
}

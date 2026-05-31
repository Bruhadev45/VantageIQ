import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchMe,
  getAuthToken,
  login as loginRequest,
  setAuthToken,
  signup as signupRequest,
  type AuthUser,
} from "../services/apiClient";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot, validate any stored token against the API.
  useEffect(() => {
    let active = true;
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((me) => {
        if (!active) return;
        if (me) setUser(me);
        else setAuthToken(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: nextUser } = await loginRequest(email, password);
    setUser(nextUser);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const { user: nextUser } = await signupRequest(email, password, name);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

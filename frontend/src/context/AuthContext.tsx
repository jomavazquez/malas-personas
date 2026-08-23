import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { clearGuestId } from "../lib/guest";
import type { User } from "../types";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string, keep?: boolean) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- context object lives alongside its provider hook
export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading, setLoading ] = useState(() => !!(localStorage.getItem("token") ?? sessionStorage.getItem("token")));

  useEffect(() => {
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
    if( !token ) return;

    api.get<{ user: User }>("/users/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: User, token: string, keep = true) => {
    if( keep ){
      localStorage.setItem("token", token);
    }else{
      sessionStorage.setItem("token", token);
    }
    clearGuestId();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      { children }
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider, same pattern as JoinModalContext/ToastContext
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import Cookies from "js-cookie";
import { loginUser, LOCAL_STORAGE__TOKEN, getCurrentUserFromToken } from "../src/services/auth.services";

// Types
interface User {
  id: number;
  username: string;
  role: "User" | "Admin" | "SuperAdmin" | "WarehouseStaff" | "DeliveryStaff";
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    adminLogin?: boolean,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: string[]) => boolean;
  isLoading: boolean;
  authReady: boolean; // explicitly signals hydration finished
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while performing network login/logout
  const [authReady, setAuthReady] = useState(false); // becomes true after initial hydration

  // Check for existing user session on app load
  useEffect(() => {
    // Rehydrate from cookie first (legacy) or from token if available
    const savedUser = Cookies.get("brightbuy_user");
    if (savedUser) {
      try {
        const userData: User = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        Cookies.remove("brightbuy_user");
      }
    } else {
      // If no cookie user, attempt deriving from JWT in localStorage
      const payload = getCurrentUserFromToken();
      if (payload && payload.exp) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp > nowSec) {
          // Build minimal user object (requires backend to include email/role in token — we have id, role only)
          const emailFromPayload = (payload as any).email || 'unknown@local';
          const usernameFromPayload = (payload as any).username || emailFromPayload.split('@')[0] || (payload.id?.toString() || 'user');
          const nameFromPayload = (payload as any).name || usernameFromPayload || 'User';
          setUser({
            id: payload.id,
            username: usernameFromPayload,
            name: nameFromPayload,
            email: emailFromPayload,
            role: payload.role
          });
        }
      }
    }
    setIsLoading(false);
    setAuthReady(true);
  }, []);

  // Track auto logout timer
  useEffect(() => {
  if (!user) return;
    const token = localStorage.getItem(LOCAL_STORAGE__TOKEN);
    if (!token) return;
    const parts = token.split('.')
    if (parts.length !== 3) return;
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const msRemaining = payload.exp * 1000 - Date.now();
        if (msRemaining > 0) {
          const timeout = setTimeout(() => {
            logout();
          }, msRemaining);
          return () => clearTimeout(timeout);
        }
      }
    } catch {}
  }, [user]);

  // Login function
  const login = async (email: string, password: string, adminLogin?: boolean) => {
    setIsLoading(true);
    try {
      const foundUser = await loginUser(email, password, adminLogin);
      // console.log("foundUser", foundUser);

      if (foundUser?.success) {
        const backendUser = foundUser.user;

        // Map backend response into our User type (prefer real name; fall back to email prefix)
        const emailStr: string = backendUser.email || "unknown@local";
        const nameStr: string = backendUser.name || emailStr.split("@")[0] || "User";
        const usernameStr: string = backendUser.username || emailStr.split("@")[0] || "user";

        const userWithoutPassword: User = {
          id: backendUser.id ?? 0, // if backend didn’t send, give default
          username: usernameStr,
          name: nameStr,
          email: emailStr,
          role: backendUser.role,
        };

        setUser(userWithoutPassword);
        // Persist in cookie (short lifetime) and let token carry session (10m)
        Cookies.set("brightbuy_user", JSON.stringify(userWithoutPassword), {
          // 10 minutes expressed as fraction of a day
          expires: 10 / (60 * 24),
        });

        // console.log("User logged in:", userWithoutPassword);

      // NOTE: navigation is handled by the calling page (login forms)

        // Attempt redirect to last path (handled outside typically, but we can emit event or set window location here if needed)
        const lastPath = sessionStorage.getItem('brightbuy_last_path');
        if (lastPath) {
          sessionStorage.removeItem('brightbuy_last_path');
          // Defer navigation responsibility to caller; optionally we could expose lastPath via context.
        }
        return { success: true, user: userWithoutPassword };
      } else {
        return {
          success: false,
          error: foundUser?.error || "Invalid username or password",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Something went wrong" };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    Cookies.remove("brightbuy_user");
  };

  // Helpers
  const isAuthenticated = () => !!user;
  const hasRole = (roles: string[]) =>
    user ? roles.includes(user.role) : false;

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isLoading,
    authReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

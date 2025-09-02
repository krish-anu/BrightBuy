import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import Cookies from "js-cookie";
import { loginUser } from "@/services/auth.services";

// Types
interface User {
  id: number;
  username: string;
  role: "admin" | "warehouse" | "delivery";
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: string[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock users for demonstration
const mockUsers: (User & { password: string })[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "John Admin",
    email: "admin@brightbuy.com",
  },
  {
    id: 2,
    username: "warehouse",
    password: "warehouse123",
    role: "warehouse",
    name: "Sarah Warehouse",
    email: "warehouse@brightbuy.com",
  },
  {
    id: 3,
    username: "delivery",
    password: "delivery123",
    role: "delivery",
    name: "Mike Delivery",
    email: "delivery@brightbuy.com",
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = Cookies.get("brightbuy_user");
    if (savedUser) {
      try {
        const userData: User = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        Cookies.remove("brightbuy_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);

   const foundUser = await loginUser(username, password);

if (foundUser?.success) {
  const userWithoutPassword = foundUser.user;

  setUser(userWithoutPassword);

  // Save user to cookie (7 days)
  Cookies.set("brightbuy_user", JSON.stringify(userWithoutPassword), {
    expires: 7,
  });

  setIsLoading(false);
  return { success: true, user: userWithoutPassword };
} else {
  setIsLoading(false);
  return { success: false, error: foundUser?.error || "Invalid username or password" };
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

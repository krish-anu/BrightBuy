import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import Cookies from "js-cookie";
import { loginUser } from "../src/services/auth.services";
import { useNavigate } from "react-router-dom";

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const foundUser = await loginUser(email, password);
      // console.log("foundUser", foundUser);

      if (foundUser?.success) {
        const backendUser = foundUser.user;

        // Map backend response into our User type
        const userWithoutPassword: User = {
          id: backendUser.id ?? 0, // if backend didn’t send, give default
          username: backendUser.username ?? backendUser.email.split("@")[0],
          name: backendUser.name ?? "Unknown",
          email: backendUser.email,
          role: backendUser.role,
        };

        setUser(userWithoutPassword);
        Cookies.set("brightbuy_user", JSON.stringify(userWithoutPassword), {
          expires: 7,
        });

        // console.log("User logged in:", userWithoutPassword);

        // Redirect based on role
        if (userWithoutPassword.role === "SuperAdmin") {
          navigate("/superadmin");
        } else if (userWithoutPassword.role === "Admin") {
          navigate("/admin");
        } else if (userWithoutPassword.role === "WarehouseStaff") {
          navigate("/admin/inventory");
        } else if (userWithoutPassword.role === "DeliveryStaff") {
          navigate("/admin/deliveries");
        } else {
          navigate("/shop");
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// src/hooks/useUser.ts
import { getCurrentUser } from "@/services/authService";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER" | string;

export const useUser = () => {
  const user = typeof window !== "undefined" ? getCurrentUser() : null;

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN"

  return {
    user,
    isAuthenticated: !!user,
    isSuperAdmin,
    isAdmin,
    role: user?.role as UserRole,
    fullName: user?.fullName || "User",
  };
};
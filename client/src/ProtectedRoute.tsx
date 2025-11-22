/**
 * ProtectedRoute Component
 * Protege rotas baseado em autenticação e role
 */
import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, currentUser } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !currentUser) {
    setLocation("/login");
    return null;
  }

  // Check role if required
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to dashboard if not authorized
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    // Redirect to dashboard if role doesn't match
    // or show unauthorized page
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}

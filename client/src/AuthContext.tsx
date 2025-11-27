 * AuthContext
  * Gerencia autenticação e sessão do usuário
    */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Organization, AuthState } from "@/types/auth";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizations } from "@/hooks/useOrganizations";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "zapper_session_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authenticate, getUser, updateUser } = useUsers();
  const { getOrganization } = useOrganizations();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    currentOrganization: null,
  });

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const user = getUser(session.userId);
        if (user && user.active) {
          const org = user.organizationId ? getOrganization(user.organizationId) : null;
          setAuthState({
            isAuthenticated: true,
            currentUser: user,
            currentOrganization: org || null,
          });
        } else {
          // Session inválida
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem(SESSION_KEY);
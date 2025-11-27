/**
 * AuthContext
 * Gerencia autenticação e sessão do usuário
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Organization, AuthState } from "@/types/auth";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizations } from "@/hooks/useOrganizations";

interface AuthContextType extends AuthState {
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
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

  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);

        // Read users directly from localStorage instead of relying on useUsers hook state
        // This ensures SSO users are recognized immediately
        const usersStored = localStorage.getItem("zapper_users");
        const allUsers = usersStored ? JSON.parse(usersStored) : [];
        const user = allUsers.find((u: User) => u.id === session.userId);

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
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (email: string, password: string) => {
    const user = authenticate(email, password);
    if (user) {
      const org = user.organizationId ? getOrganization(user.organizationId) : null;
      setAuthState({
        isAuthenticated: true,
        currentUser: user,
        currentOrganization: org || null,
      });
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      currentUser: null,
      currentOrganization: null,
    });
    localStorage.removeItem(SESSION_KEY);
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (authState.currentUser) {
      updateUser(authState.currentUser.id, updates);
      setAuthState((prev) => ({
        ...prev,
        currentUser: prev.currentUser ? { ...prev.currentUser, ...updates } : null,
      }));
    }
  };

  const getAuthHeaders = async () => {
    // For now, return empty headers since we're using mock auth
    // In production, this would return JWT tokens or session cookies
    return {
      "X-Organization-ID": authState.currentOrganization?.id || "",
      "X-User-ID": authState.currentUser?.id || "",
    };
  };

  return (
    <AuthContext.Provider value={{ ...authState, isLoading, login, logout, updateCurrentUser, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

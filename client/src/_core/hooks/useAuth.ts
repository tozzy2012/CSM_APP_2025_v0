import { useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  organizationId?: string | null;
}

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading] = useState(false);

  async function login(email: string, _password: string) {
    // TODO: integrar com backend real.
    setUser({
      id: "demo-user",
      name: "Demo User",
      email,
      organizationId: "org-demo",
    });
  }

  async function logout() {
    setUser(null);
  }

  return { user, loading, login, logout };
}

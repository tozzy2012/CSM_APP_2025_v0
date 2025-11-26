export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  CSM = "CSM"
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  createdAt: string;
  active: boolean;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  status?: 'active' | 'inactive';
  createdAt: string;
  active: boolean;
  aiSettings?: AISettings;
}

export interface AISettings {
  openaiApiKey?: string;
  systemPrompt?: string;
  creativityLevel?: number; // 0.0 to 1.0
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentOrganization: Organization | null;
}

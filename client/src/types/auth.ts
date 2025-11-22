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
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  active: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentOrganization: Organization | null;
}

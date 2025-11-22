/**
 * useUsers Hook
 * Gerencia usuários no localStorage
 */
import { useState, useEffect } from "react";
import type { User, UserRole } from "@/types/auth";

const STORAGE_KEY = "zapper_users";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUsers(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading users:", error);
      }
    } else {
      // Criar Super Admin padrão
      const superAdmin: User = {
        id: "super-admin-001",
        email: "admin",
        password: "adminadmin", // Em produção, usar hash
        name: "Super Admin",
        role: "SUPER_ADMIN" as UserRole,
        organizationId: null,
        createdAt: new Date().toISOString(),
        active: true,
      };

      // Criar Admin da organização demo
      const demoAdmin: User = {
        id: "demo-admin-001",
        email: "demo@admin.com",
        password: "demo123",
        name: "Demo Admin",
        role: "ORG_ADMIN" as UserRole,
        organizationId: "demo-org-001",
        createdAt: new Date().toISOString(),
        active: true,
      };

      const initialUsers = [superAdmin, demoAdmin];
      setUsers(initialUsers);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
    }
  }, []);

  // Save to localStorage
  const saveUsers = (usersToSave: User[]) => {
    setUsers(usersToSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usersToSave));
  };

  // Create user
  const createUser = (userData: Omit<User, "id" | "createdAt">): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    return newUser;
  };

  // Update user
  const updateUser = (id: string, updates: Partial<User>) => {
    const updated = users.map((user) =>
      user.id === id ? { ...user, ...updates } : user
    );
    saveUsers(updated);
  };

  // Delete user
  const deleteUser = (id: string) => {
    const filtered = users.filter((user) => user.id !== id);
    saveUsers(filtered);
  };

  // Get user by ID
  const getUser = (id: string): User | undefined => {
    return users.find((user) => user.id === id);
  };

  // Get users by organization
  const getUsersByOrganization = (organizationId: string): User[] => {
    return users.filter((user) => user.organizationId === organizationId);
  };

  // Authenticate user
  const authenticate = (email: string, password: string): User | null => {
    // Sempre ler do localStorage para garantir dados atualizados
    const stored = localStorage.getItem(STORAGE_KEY);
    const allUsers: User[] = stored ? JSON.parse(stored) : [];
    const user = allUsers.find(
      (u: User) => u.email === email && u.password === password && u.active
    );
    return user || null;
  };

  const changePassword = (userId: string, newPassword: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, password: newPassword } : u
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    users,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    getUsersByOrganization,
    authenticate,
    changePassword,
  };
}

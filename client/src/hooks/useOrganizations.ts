/**
 * useOrganizations Hook
 * Gerencia organizações no localStorage
 */
import { useState, useEffect } from "react";
import type { Organization } from "@/types/auth";

const STORAGE_KEY = "zapper_organizations";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setOrganizations(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading organizations:", error);
      }
    } else {
      // Criar organização padrão "Demo Organization"
      const demoOrg: Organization = {
        id: "demo-org-001",
        name: "Demo Organization",
        createdAt: new Date().toISOString(),
        active: true,
      };
      setOrganizations([demoOrg]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([demoOrg]));
    }
  }, []);

  // Save to localStorage
  const saveOrganizations = (orgsToSave: Organization[]) => {
    setOrganizations(orgsToSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orgsToSave));
  };

  // Create organization
  const createOrganization = (orgData: Omit<Organization, "id" | "createdAt">): Organization => {
    const newOrg: Organization = {
      ...orgData,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedOrgs = [...organizations, newOrg];
    saveOrganizations(updatedOrgs);
    return newOrg;
  };

  // Update organization
  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    const updated = organizations.map((org) =>
      org.id === id ? { ...org, ...updates } : org
    );
    saveOrganizations(updated);
  };

  // Delete organization
  const deleteOrganization = (id: string) => {
    const filtered = organizations.filter((org) => org.id !== id);
    saveOrganizations(filtered);
  };

  // Get organization by ID
  const getOrganization = (id: string): Organization | undefined => {
    return organizations.find((org) => org.id === id);
  };

  return {
    organizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganization,
  };
}

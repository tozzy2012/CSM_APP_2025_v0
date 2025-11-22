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
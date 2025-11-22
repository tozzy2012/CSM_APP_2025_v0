/**
 * Hook para gerenciar status configuráveis de accounts
 */
import { useState, useEffect } from "react";

export interface AccountStatus {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isDefault?: boolean; // Status padrão para novos accounts
}

const STORAGE_KEY = "zapper_account_statuses";

// Status padrão
const defaultStatuses: AccountStatus[] = [
  { id: "1", name: "Saudável", color: "green", icon: "check-circle", order: 1, isDefault: true },
  { id: "2", name: "Atenção", color: "yellow", icon: "alert-circle", order: 2 },
  { id: "3", name: "Crítico", color: "red", icon: "x-circle", order: 3 },
  { id: "4", name: "Salvamento", color: "orange", icon: "life-buoy", order: 4 },
  { id: "5", name: "Upsell", color: "blue", icon: "trending-up", order: 5 },
  { id: "6", name: "Churn", color: "gray", icon: "user-x", order: 6 },
  { id: "7", name: "Inadimplente", color: "purple", icon: "ban", order: 7 },
];

export function useAccountStatus() {
  const [statuses, setStatuses] = useState<AccountStatus[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setStatuses(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar status:", error);
        setStatuses(defaultStatuses);
      }
    } else {
      setStatuses(defaultStatuses);
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    if (statuses.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
    }
  }, [statuses]);

  const createStatus = (status: Omit<AccountStatus, "id">) => {
    const newStatus: AccountStatus = {
      ...status,
      id: Date.now().toString(),
    };
    setStatuses([...statuses, newStatus]);
    return newStatus;
  };

  const updateStatus = (id: string, updates: Partial<AccountStatus>) => {
    setStatuses(
      statuses.map((status) =>
        status.id === id ? { ...status, ...updates } : status
      )
    );
  };

  const deleteStatus = (id: string) => {
    setStatuses(statuses.filter((status) => status.id !== id));
  };

  const reorderStatuses = (newOrder: AccountStatus[]) => {
    setStatuses(newOrder);
  };

  const getStatusColor = (statusName: string) => {
    const status = statuses.find((s) => s.name === statusName);
    return status?.color || "gray";
  };

  const getDefaultStatus = () => {
    return statuses.find((s) => s.isDefault) || statuses[0];
  };

  const setDefaultStatus = (id: string) => {
    setStatuses(
      statuses.map((status) => ({
        ...status,
        isDefault: status.id === id,
      }))
    );
  };

  const resetToDefault = () => {
    setStatuses(defaultStatuses);
  };

  return {
    statuses,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    getStatusColor,
    getDefaultStatus,
    setDefaultStatus,
    resetToDefault,
  };
}

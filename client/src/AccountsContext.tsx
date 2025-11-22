 * Accounts Context
 * Context para compartilhar estado de accounts entre componentes
 */
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts, Account } from "@/hooks/useAccounts";

export type { Account };

interface AccountsContextType {
  accounts: Account[];
  getAccount: (id: string) => Account | undefined;
  createAccount: (data: Omit<Account, "id" | "createdAt" | "updatedAt">) => Account;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getStats: () => {
    total: number;
    healthy: number;
    atRisk: number;
    critical: number;
    totalMRR: number;
    avgHealthScore: number;
  };
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const accountsData = useAccounts();

  // Filtrar accounts por organização
  const filteredAccounts = useMemo(() => {
    // Super Admin vê todos os accounts
    if (currentUser?.role === "SUPER_ADMIN") {
      return accountsData.accounts;
    }
    // Admin da Org e CSM veem apenas accounts da sua organização
    if (currentUser?.organizationId) {
      return accountsData.getAccountsByOrganization(currentUser.organizationId);
    }
    return [];
  }, [accountsData.accounts, currentUser]);

  // Calcular stats sobre accounts filtrados
  const getStats = useMemo(() => {
    return () => {
      const total = filteredAccounts.length;
      const healthy = filteredAccounts.filter((a) => a.healthStatus === "healthy").length;
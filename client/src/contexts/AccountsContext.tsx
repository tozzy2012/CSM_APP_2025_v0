import React, { createContext, useContext } from "react";
import { useAccounts, Account } from "../hooks/useAccounts";

interface AccountsContextValue {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  createAccount: (data: Omit<Account, "id" | "createdAt" | "updatedAt">) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccount: (id: string) => Account | undefined;
  getAccountsByOrganization: (organizationId: string) => Account[];
  refetch: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const accountsData = useAccounts();

  return (
    <AccountsContext.Provider value={accountsData}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccountsContext() {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error(
      "useAccountsContext must be used within AccountsProvider"
    );
  }
  return ctx;
}

export type { Account };

import { useState, useEffect } from "react";

export interface Account {
    id: string;
    organizationId: string;
    clientId: string;
    name: string;
    industry: string;
    stage: string;
    type: string;
    status: string;
    healthStatus: "healthy" | "at-risk" | "critical";
    healthScore: number;
    mrr: number;
    contractValue: number;
    contractStart: string;
    contractEnd: string;
    csm: string;
    employees: number;
    website: string;
    createdAt?: string;
    updatedAt?: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:8000`
    : "http://localhost:8000";

const API_URL = `${API_BASE}/api/v1`;

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar accounts do backend
    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/accounts`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAccounts(data);
            setError(null);
        } catch (error) {
            console.error("Error loading accounts:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const createAccount = async (account: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account> => {
        try {
            const response = await fetch(`${API_URL}/accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(account),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const newAccount = await response.json();
            setAccounts((prev) => [...prev, newAccount]);
            return newAccount;
        } catch (error) {
            console.error("Error creating account:", error);
            throw error;
        }
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        try {
            const response = await fetch(`${API_URL}/accounts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const updatedAccount = await response.json();
            setAccounts((prev) =>
                prev.map((account) => (account.id === id ? updatedAccount : account))
            );
        } catch (error) {
            console.error("Error updating account:", error);
            throw error;
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/accounts/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            setAccounts((prev) => prev.filter((account) => account.id !== id));
        } catch (error) {
            console.error("Error deleting account:", error);
            throw error;
        }
    };

    const getAccount = (id: string) => {
        return accounts.find((account) => account.id === id);
    };

    const getAccountsByOrganization = (organizationId: string) => {
        return accounts.filter((account) => account.organizationId === organizationId);
    };

    return {
        accounts,
        loading,
        error,
        createAccount,
        updateAccount,
        deleteAccount,
        getAccount,
        getAccountsByOrganization,
        refetch: fetchAccounts,
    };
}

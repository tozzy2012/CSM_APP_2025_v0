/**
 * Hook para gerenciar playbooks com API backend
 */
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:8000`
    : "http://localhost:8000";

const API_URL = `${API_BASE}/api/v1`;

export interface PlaybookDoc {
    id: string;
    name: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    version: string;
    author: string;
    views: number;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
}

export function usePlaybooks() {
    console.log("🔵 usePlaybooks hook initialized");
    const [playbooks, setPlaybooks] = useState<PlaybookDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getAuthHeaders } = useAuth();
    console.log("🔵 useAuth hook obtained");

    // Carregar playbooks do backend
    const fetchPlaybooks = async () => {
        console.log("🟢 fetchPlaybooks called");
        setLoading(true);
        setError(null);
        try {
            const headers = await getAuthHeaders();
            console.log("🟢 Fetching playbooks with headers:", headers);
            const response = await axios.get(`${API_URL}/playbooks`, {
                headers,
            });
            console.log("🟢 Fetched playbooks response:", response.data);
            setPlaybooks(response.data);
        } catch (err: any) {
            console.error("🔴 Erro ao carregar playbooks:", err);
            setError(err.response?.data?.detail || "Erro ao carregar playbooks");
            setPlaybooks([]);
        } finally {
            setLoading(false);
        }
    };

    // Carregar na inicialização
    useEffect(() => {
        console.log("🟡 useEffect triggered in usePlaybooks");
        fetchPlaybooks();
    }, []);
    console.log("🔵 usePlaybooks hook returning, playbooks count:", playbooks.length);

    // Buscar playbook por ID
    const getPlaybook = async (id: string): Promise<PlaybookDoc | null> => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/playbooks/${id}`, {
                headers,
            });
            return response.data;
        } catch (err) {
            console.error("Erro ao buscar playbook:", err);
            return null;
        }
    };

    // Criar novo playbook
    const createPlaybook = async (
        data: Omit<PlaybookDoc, "id" | "createdAt" | "updatedAt" | "views">
    ): Promise<PlaybookDoc | null> => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(`${API_URL}/playbooks`, data, {
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
            });
            const newPlaybook = response.data;
            setPlaybooks((prev) => [newPlaybook, ...prev]);
            return newPlaybook;
        } catch (err) {
            console.error("Erro ao criar playbook:", err);
            return null;
        }
    };

    // Atualizar playbook
    const updatePlaybook = async (
        id: string,
        data: Partial<PlaybookDoc>
    ): Promise<void> => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.put(`${API_URL}/playbooks/${id}`, data, {
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
            });
            const updatedPlaybook = response.data;
            setPlaybooks((prev) =>
                prev.map((p) => (p.id === id ? updatedPlaybook : p))
            );
        } catch (err) {
            console.error("Erro ao atualizar playbook:", err);
            throw err;
        }
    };

    // Deletar playbook
    const deletePlaybook = async (id: string): Promise<void> => {
        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${API_URL}/playbooks/${id}`, {
                headers,
            });
            setPlaybooks((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Erro ao deletar playbook:", err);
            throw err;
        }
    };

    // Incrementar views
    const incrementViews = async (id: string): Promise<void> => {
        try {
            const headers = await getAuthHeaders();
            await axios.post(
                `${API_URL}/playbooks/${id}/increment-views`,
                {},
                {
                    headers,
                }
            );
            setPlaybooks((prev) =>
                prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p))
            );
        } catch (err) {
            console.error("Erro ao incrementar views:", err);
        }
    };

    return {
        playbooks,
        loading,
        error,
        fetchPlaybooks,
        getPlaybook,
        createPlaybook,
        updatePlaybook,
        deletePlaybook,
        incrementViews,
    };
}

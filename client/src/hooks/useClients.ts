import { useState, useEffect } from "react";

export interface PowerMapContact {
    id: string;
    name: string;
    role: string; // Cargo
    department: string;
    influence: "champion" | "influencer" | "neutral" | "blocker"; // Nível de influência
    email: string;
    phone: string;
    notes: string;
}

export interface ClientContact {
    id: string;
    type: "phone" | "whatsapp" | "email" | "other";
    value: string;
    label: string; // Ex: "Telefone Comercial", "WhatsApp CEO"
    isPrimary: boolean;
}

export interface Client {
    id: string;
    // Dados da Empresa
    name: string; // Nome Fantasia
    legalName: string; // Razão Social
    cnpj: string;
    industry: string;
    website: string;

    // Endereço
    address: {
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    // Informações Comerciais
    companySize: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
    revenue: string; // Faturamento anual
    foundedYear: number;

    // Mapa de Poder (Stakeholders)
    powerMap: PowerMapContact[];

    // Contatos Múltiplos
    contacts: ClientContact[];

    // Informações Adicionais
    notes: string;
    tags: string[];

    // Metadados
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ""
    : "http://localhost:8000";

const API_URL = `${API_BASE}/api/v1`;

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar clients do backend
    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/clients`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setClients(data);
            setError(null);
        } catch (error) {
            console.error("Error loading clients:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const addClient = async (client: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> => {
        try {
            const response = await fetch(`${API_URL}/clients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(client),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const newClient = await response.json();
            setClients((prev) => [...prev, newClient]);
            return newClient;
        } catch (error) {
            console.error("Error creating client:", error);
            throw error;
        }
    };

    const updateClient = async (id: string, updates: Partial<Client>) => {
        try {
            const response = await fetch(`${API_URL}/clients/${id}`, {
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

            const updatedClient = await response.json();
            setClients((prev) =>
                prev.map((client) => (client.id === id ? updatedClient : client))
            );
        } catch (error) {
            console.error("Error updating client:", error);
            throw error;
        }
    };

    const deleteClient = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/clients/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            setClients((prev) => prev.filter((client) => client.id !== id));
        } catch (error) {
            console.error("Error deleting client:", error);
            throw error;
        }
    };

    const getClientById = (id: string) => {
        return clients.find((client) => client.id === id);
    };

    const getClientByCNPJ = (cnpj: string) => {
        return clients.find((client) => client.cnpj === cnpj);
    };

    return {
        clients,
        loading,
        error,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        getClientByCNPJ,
        refetch: fetchClients,
    };
}

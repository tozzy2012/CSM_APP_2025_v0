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

const STORAGE_KEY = "clients";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);

  // Carregar clients do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading clients:", error);
      }
    }
  }, []);

  // Salvar clients no localStorage
  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients));
  };

  const addClient = (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveClients([...clients, newClient]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const updatedClients = clients.map((client) =>
      client.id === id
        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
        : client
    );
    saveClients(updatedClients);
  };

  const deleteClient = (id: string) => {
    saveClients(clients.filter((client) => client.id !== id));
  };

  const getClientById = (id: string) => {
    return clients.find((client) => client.id === id);
  };

  const getClientByCNPJ = (cnpj: string) => {
    return clients.find((client) => client.cnpj === cnpj);
  };

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientByCNPJ,
  };
}

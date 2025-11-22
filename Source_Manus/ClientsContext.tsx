import { useClients, Client, PowerMapContact, ClientContact } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  getClientByCNPJ: (cnpj: string) => Client | undefined;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const clientsData = useClients();
  const { currentUser } = useAuth();

  // Filtrar clients por organização
  const filteredClients = useMemo(() => {
    // Super Admin vê todos os clients
    if (currentUser?.role === "SUPER_ADMIN") {
      return clientsData.clients;
    }
    // Admin da Org e CSM veem apenas clients da sua organização
    return clientsData.clients.filter(
      (client) => client.organizationId === currentUser?.organizationId
    );
  }, [clientsData.clients, currentUser?.organizationId, currentUser?.role]);

  const contextValue = useMemo(
    () => ({
      ...clientsData,
      clients: filteredClients,
    }),
    [clientsData, filteredClients]
  );

  return (
    <ClientsContext.Provider value={contextValue}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClientsContext() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error("useClientsContext must be used within ClientsProvider");
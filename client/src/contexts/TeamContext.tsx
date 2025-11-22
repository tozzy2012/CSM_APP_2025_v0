import { createContext, useContext, ReactNode } from "react";

interface CSM {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
}

interface TeamContextType {
  csms: CSM[];
  teams: Team[];
  getCSM: (id: string) => CSM | undefined;
  getTeam: (id: string) => Team | undefined;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Mock data - será substituído por dados reais do backend
const MOCK_CSMS: CSM[] = [
  { id: "1", name: "João Silva", email: "joao@example.com" },
  { id: "2", name: "Maria Santos", email: "maria@example.com" },
  { id: "3", name: "Pedro Costa", email: "pedro@example.com" },
];

const MOCK_TEAMS: Team[] = [
  { id: "1", name: "CS Team A" },
  { id: "2", name: "CS Team B" },
  { id: "3", name: "Enterprise Team" },
];

export function TeamProvider({ children }: { children: ReactNode }) {
  const getCSM = (id: string) => MOCK_CSMS.find((csm) => csm.id === id);
  const getTeam = (id: string) => MOCK_TEAMS.find((team) => team.id === id);

  return (
    <TeamContext.Provider
      value={{
        csms: MOCK_CSMS,
        teams: MOCK_TEAMS,
        getCSM,
        getTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamContext must be used within TeamProvider");
  }
  return context;
}

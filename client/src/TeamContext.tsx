 * Team Context
 * Context para compartilhar estado de CSMs e Teams
 */
import { createContext, useContext, ReactNode } from "react";
import { useTeam, CSM, Team } from "@/hooks/useTeam";

interface TeamContextType {
  csms: CSM[];
  teams: Team[];
  getCSM: (id: string) => CSM | undefined;
  createCSM: (data: Omit<CSM, "id">) => CSM;
  updateCSM: (id: string, data: Partial<CSM>) => void;
  deleteCSM: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
  createTeam: (data: Omit<Team, "id">) => Team;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const teamData = useTeam();

  return <TeamContext.Provider value={teamData}>{children}</TeamContext.Provider>;
}

export function useTeamContext() {
  const context = useContext(TeamContext);
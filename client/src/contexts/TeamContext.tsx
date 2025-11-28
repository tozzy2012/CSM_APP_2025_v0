import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { apiClient } from "../api";

export interface CSM {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
}

interface TeamContextType {
  csms: CSM[];
  teams: Team[];
  getCSM: (id: string) => CSM | undefined;
  getTeam: (id: string) => Team | undefined;
  addCSM: (csm: Omit<CSM, "id" | "createdAt">) => void;
  updateCSM: (id: string, data: Partial<CSM>) => void;
  deleteCSM: (id: string) => void;
  addTeam: (team: Omit<Team, "id" | "createdAt">) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const INITIAL_TEAMS: Team[] = [
  {
    id: "1",
    name: "CS Team A",
    description: "Team focusing on Enterprise clients",
    memberIds: ["1", "2"],
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "CS Team B",
    description: "Team focusing on SMB clients",
    memberIds: ["3"],
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Enterprise Team",
    description: "Specialized team for large accounts",
    memberIds: ["1"],
    createdAt: new Date().toISOString()
  },
];

export function TeamProvider({ children }: { children: ReactNode }) {
  const [csms, setCSMs] = useState<CSM[]>([]);

  // Debug: Log when provider mounts
  useEffect(() => {
    console.log("TeamProvider mounted - clearing legacy storage");
    localStorage.removeItem("team_csms");
  }, []);

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem("team_teams");
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching users from API...");
        const users = await apiClient.get<any[]>("/api/v1/users");
        console.log("Users fetched:", users);
        const mappedCSMs: CSM[] = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatarUrl,
          role: "CSM", // Default role for now
          createdAt: user.createdAt
        }));
        setCSMs(mappedCSMs);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Persist to localStorage whenever data changes
  // Note: We don't persist csms anymore as they come from API
  // useEffect(() => {
  //   localStorage.setItem("team_csms", JSON.stringify(csms));
  // }, [csms]);

  useEffect(() => {
    localStorage.setItem("team_teams", JSON.stringify(teams));
  }, [teams]);

  const getCSM = (id: string) => csms.find((csm) => csm.id === id);
  const getTeam = (id: string) => teams.find((team) => team.id === id);

  const addCSM = (csmData: Omit<CSM, "id" | "createdAt">) => {
    // TODO: Implement API call to create user
    const newCSM: CSM = {
      ...csmData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCSMs((prev) => [...prev, newCSM]);
  };

  const updateCSM = (id: string, data: Partial<CSM>) => {
    setCSMs((prev) =>
      prev.map((csm) => (csm.id === id ? { ...csm, ...data } : csm))
    );
  };

  const deleteCSM = (id: string) => {
    setCSMs((prev) => prev.filter((csm) => csm.id !== id));
    // Also remove from teams
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        memberIds: team.memberIds.filter((memberId) => memberId !== id),
      }))
    );
  };

  const addTeam = (teamData: Omit<Team, "id" | "createdAt">) => {
    const newTeam: Team = {
      ...teamData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  const updateTeam = (id: string, data: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === id ? { ...team, ...data } : team))
    );
  };

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== id));
  };

  return (
    <TeamContext.Provider
      value={{
        csms,
        teams,
        getCSM,
        getTeam,
        addCSM,
        updateCSM,
        deleteCSM,
        addTeam,
        updateTeam,
        deleteTeam,
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

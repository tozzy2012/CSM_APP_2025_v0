/**
 * Hook para gerenciar CSMs e Times
 */
import { useState, useEffect } from "react";

export interface CSM {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // IDs dos CSMs
  color: string;
}

const CSMS_STORAGE_KEY = "zapper_csms";
const TEAMS_STORAGE_KEY = "zapper_teams";

// Dados iniciais
const initialCSMs: CSM[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Senior CSM",
    active: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "CSM",
    active: true,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "CSM",
    active: true,
  },
];

const initialTeams: Team[] = [
  {
    id: "1",
    name: "Enterprise",
    description: "Time responsável por contas enterprise",
    members: ["1"],
    color: "#3b82f6",
  },
  {
    id: "2",
    name: "SMB",
    description: "Time responsável por pequenas e médias empresas",
    members: ["2", "3"],
    color: "#10b981",
  },
];

export function useTeam() {
  const [csms, setCSMs] = useState<CSM[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Carregar CSMs
  useEffect(() => {
    const stored = localStorage.getItem(CSMS_STORAGE_KEY);
    if (stored) {
      try {
        setCSMs(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar CSMs:", error);
        setCSMs(initialCSMs);
        localStorage.setItem(CSMS_STORAGE_KEY, JSON.stringify(initialCSMs));
      }
    } else {
      setCSMs(initialCSMs);
      localStorage.setItem(CSMS_STORAGE_KEY, JSON.stringify(initialCSMs));
    }
  }, []);

  // Carregar Teams
  useEffect(() => {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (stored) {
      try {
        setTeams(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar teams:", error);
        setTeams(initialTeams);
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(initialTeams));
      }
    } else {
      setTeams(initialTeams);
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(initialTeams));
    }
  }, []);

  // Salvar CSMs
  useEffect(() => {
    if (csms.length > 0) {
      localStorage.setItem(CSMS_STORAGE_KEY, JSON.stringify(csms));
    }
  }, [csms]);

  // Salvar Teams
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    }
  }, [teams]);

  // CSM functions
  const getCSM = (id: string): CSM | undefined => {
    return csms.find((c) => c.id === id);
  };

  const createCSM = (data: Omit<CSM, "id">): CSM => {
    const newCSM: CSM = {
      ...data,
      id: Date.now().toString(),
    };
    setCSMs((prev) => [...prev, newCSM]);
    return newCSM;
  };

  const updateCSM = (id: string, data: Partial<CSM>): void => {
    setCSMs((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCSM = (id: string): void => {
    setCSMs((prev) => prev.filter((c) => c.id !== id));
  };

  // Team functions
  const getTeam = (id: string): Team | undefined => {
    return teams.find((t) => t.id === id);
  };

  const createTeam = (data: Omit<Team, "id">): Team => {
    const newTeam: Team = {
      ...data,
      id: Date.now().toString(),
    };
    setTeams((prev) => [...prev, newTeam]);
    return newTeam;
  };

  const updateTeam = (id: string, data: Partial<Team>): void => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTeam = (id: string): void => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    csms,
    teams,
    getCSM,
    createCSM,
    updateCSM,
    deleteCSM,
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}

import React, { createContext, useContext, ReactNode } from "react";
import { usePlaybooks, PlaybookDoc } from "@/hooks/usePlaybooks";

interface PlaybooksContextType {
  playbooks: PlaybookDoc[];
  loading: boolean;
  error: string | null;
  fetchPlaybooks: () => Promise<void>;
  getPlaybook: (id: string) => Promise<PlaybookDoc | null>;
  createPlaybook: (data: Omit<PlaybookDoc, "id" | "createdAt" | "updatedAt" | "views">) => Promise<PlaybookDoc | null>;
  updatePlaybook: (id: string, data: Partial<PlaybookDoc>) => Promise<void>;
  deletePlaybook: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
}

const PlaybooksContext = createContext<PlaybooksContextType | undefined>(undefined);

export const PlaybooksProvider = ({ children }: { children: ReactNode }) => {
  const playbooksData = usePlaybooks();

  return (
    <PlaybooksContext.Provider value={playbooksData}>
      {children}
    </PlaybooksContext.Provider>
  );
};

export const usePlaybooksContext = () => {
  const context = useContext(PlaybooksContext);
  if (!context) {
    throw new Error("usePlaybooksContext must be used within PlaybooksProvider");
  }
  return context;
};

/**
 * Playbooks Context
 * Context para compartilhar estado de playbooks entre componentes
 */
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlaybooks, PlaybookDoc } from "@/hooks/usePlaybooks";

interface PlaybooksContextType {
  playbooks: PlaybookDoc[];
  getPlaybook: (id: string) => PlaybookDoc | undefined;
  createPlaybook: (data: Omit<PlaybookDoc, "id" | "createdAt" | "updatedAt" | "views">) => PlaybookDoc;
  updatePlaybook: (id: string, data: Partial<PlaybookDoc>) => void;
  deletePlaybook: (id: string) => void;
  incrementViews: (id: string) => void;
}

const PlaybooksContext = createContext<PlaybooksContextType | undefined>(undefined);

export function PlaybooksProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const playbooksData = usePlaybooks();

  // Filtrar playbooks por organização
  const filteredPlaybooks = useMemo(() => {
    // Super Admin vê todos os playbooks
    if (currentUser?.role === "SUPER_ADMIN") {
      return playbooksData.playbooks;
    }
    // Admin da Org e CSM veem apenas playbooks da sua organização
    if (currentUser?.organizationId) {
      return playbooksData.getPlaybooksByOrganization(currentUser.organizationId);
    }
    return [];
  }, [playbooksData.playbooks, currentUser]);

  const contextValue = useMemo(() => ({
    ...playbooksData,
    playbooks: filteredPlaybooks,
  }), [playbooksData, filteredPlaybooks]);

  return (
    <PlaybooksContext.Provider value={contextValue}>
      {children}
    </PlaybooksContext.Provider>
  );
}

export function usePlaybooksContext() {
  const context = useContext(PlaybooksContext);
  if (!context) {
    throw new Error("usePlaybooksContext must be used within PlaybooksProvider");
  }
  return context;
}

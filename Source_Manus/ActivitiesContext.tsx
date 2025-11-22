 * Activities Context
 */
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivities, Activity } from "@/hooks/useActivities";

interface ActivitiesContextType {
  activities: Activity[];
  getActivity: (id: string) => Activity | undefined;
  getActivitiesByAccount: (accountId: string) => Activity[];
  createActivity: (data: Omit<Activity, "id" | "createdAt" | "updatedAt">) => Activity;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  completeActivity: (id: string) => void;
  updateActivityStatus: (id: string, newStatus: Activity["status"]) => void;
  getStats: () => {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const activitiesData = useActivities();

  // Filtrar activities por organização
  const filteredActivities = useMemo(() => {
    // Super Admin vê todas as activities
    if (currentUser?.role === "SUPER_ADMIN") {
      return activitiesData.activities;
    }
    // Admin da Org e CSM veem apenas activities da sua organização
    if (currentUser?.organizationId) {
      return activitiesData.getActivitiesByOrganization(currentUser.organizationId);
    }
    return [];
  }, [activitiesData.activities, currentUser]);

  const contextValue = useMemo(() => ({
    ...activitiesData,
    activities: filteredActivities,
  }), [activitiesData, filteredActivities]);

  return (
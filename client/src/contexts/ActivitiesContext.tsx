import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiClient } from "../api";

export interface Activity {
  id: string;
  organizationId: string;
  accountId: string;
  title: string;
  description?: string;
  type: "note" | "call" | "email" | "meeting" | "system";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  assignee?: string;
  team?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface ActivitiesContextType {
  activities: Activity[];
  loading: boolean;
  createActivity: (data: Omit<Activity, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  updateActivityStatus: (id: string, status: Activity["status"]) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  getActivitiesByAccount: (accountId: string) => Activity[];
  getStats: () => { total: number; pending: number; completed: number };
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { getAuthHeaders } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const data = await apiClient.get<Activity[]>("/api/v1/activities");
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const createActivity = async (data: Omit<Activity, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log("Creating activity with data:", data);
      const newActivity = await apiClient.post<Activity>("/api/v1/activities", {
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        assignee: data.assignee,
        team: data.team,
        due_date: data.dueDate,
        account_id: data.accountId,
      });

      console.log("New activity created:", newActivity);
      setActivities((prev) => [newActivity, ...prev]);
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  };

  const updateActivity = async (id: string, data: Partial<Activity>) => {
    try {
      const updated = await apiClient.put<Activity>(`/api/v1/activities/${id}`, data);
      setActivities((prev) =>
        prev.map((activity) => (activity.id === id ? updated : activity))
      );
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  };

  const updateActivityStatus = async (id: string, status: Activity["status"]) => {
    await updateActivity(id, {
      status,
      completedAt: status === "completed" ? new Date().toISOString() : undefined
    });
  };

  const deleteActivity = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/activities/${id}`);
      setActivities((prev) => prev.filter((activity) => activity.id !== id));
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw error;
    }
  };

  const getActivitiesByAccount = (accountId: string) => {
    return activities.filter((activity) => activity.accountId === accountId);
  };

  const getStats = () => {
    return {
      total: activities.length,
      pending: activities.filter((a) => a.status === "pending").length,
      completed: activities.filter((a) => a.status === "completed").length,
    };
  };

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        loading,
        createActivity,
        updateActivity,
        updateActivityStatus,
        deleteActivity,
        getActivitiesByAccount,
        getStats,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivitiesContext() {
  const context = useContext(ActivitiesContext);
  if (!context) {
    throw new Error("useActivitiesContext must be used within ActivitiesProvider");
  }
  return context;
}

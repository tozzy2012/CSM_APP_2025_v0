/**
 * Hook para gerenciar Activities
 */
import { useState, useEffect } from "react";

export interface Activity {
  id: string;
  organizationId: string; // ID da organização dona desta activity
  accountId: string;
  type: "note" | "call" | "email" | "meeting" | "system";
  title: string;
  description: string;
  assignee: string; // CSM ID
  team: string; // Team ID
  status: "pending" | "in-progress" | "completed" | "cancelled";
  dueDate: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const STORAGE_KEY = "zapper_activities";

// Dados iniciais (vazio - activities devem ser criadas com organizationId)
const initialActivities: Activity[] = [
  /*
  {
    id: "1",
    accountId: "1",
    type: "call",
    title: "Quarterly Business Review",
    description: "Revisar métricas do Q1 e planejar Q2",
    assignee: "1",
    team: "1",
    status: "pending",
    dueDate: "2024-04-15",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
    createdBy: "1",
  },
  {
    id: "2",
    accountId: "2",
    type: "email",
    title: "Follow-up onboarding",
    description: "Verificar progresso do onboarding",
    assignee: "2",
    team: "2",
    status: "completed",
    dueDate: "2024-03-10",
    completedDate: "2024-03-10",
    createdAt: "2024-03-05",
    updatedAt: "2024-03-10",
    createdBy: "2",
  },*/
];

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setActivities(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar activities:", error);
        setActivities(initialActivities);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialActivities));
      }
    } else {
      setActivities(initialActivities);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialActivities));
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities]);

  const getActivity = (id: string): Activity | undefined => {
    return activities.find((a) => a.id === id);
  };

  const getActivitiesByAccount = (accountId: string): Activity[] => {
    return activities.filter((a) => a.accountId === accountId);
  };

  const getActivitiesByOrganization = (organizationId: string | null): Activity[] => {
    if (!organizationId) {
      // Super Admin vê todas as activities
      return activities;
    }
    return activities.filter((a) => a.organizationId === organizationId);
  };

  const createActivity = (data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Activity => {
    const now = new Date().toISOString();
    const newActivity: Activity = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setActivities((prev) => [...prev, newActivity]);
    return newActivity;
  };

  const updateActivity = (id: string, data: Partial<Activity>): void => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
  };

  const deleteActivity = (id: string): void => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const completeActivity = (id: string): void => {
    updateActivity(id, {
      status: "completed",
      completedDate: new Date().toISOString(),
    });
  };

  const updateActivityStatus = (id: string, newStatus: Activity["status"]): void => {
    const updates: Partial<Activity> = { status: newStatus };
    if (newStatus === "completed") {
      updates.completedDate = new Date().toISOString();
    }
    updateActivity(id, updates);
  };

  // Estatísticas
  const getStats = () => {
    const total = activities.length;
    const pending = activities.filter((a) => a.status === "pending").length;
    const inProgress = activities.filter((a) => a.status === "in-progress").length;
    const completed = activities.filter((a) => a.status === "completed").length;
    
    const now = new Date();
    const overdue = activities.filter(
      (a) => a.status !== "completed" && new Date(a.dueDate) < now
    ).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  };

  return {
    activities,
    getActivity,
    getActivitiesByAccount,
    getActivitiesByOrganization,
    createActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    updateActivityStatus,
    getStats,
  };
}

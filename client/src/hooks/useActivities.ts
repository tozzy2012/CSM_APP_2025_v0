/**
 * Hook para gerenciar Activities
 */
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../api";

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
    completedAt?: string; // Changed from completedDate to match API
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export function useActivities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch activities
    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<Activity[]>("/api/v1/activities");
            setActivities(data);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar activities:", err);
            setError("Falha ao carregar atividades");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const getActivity = (id: string): Activity | undefined => {
        return activities.find((a) => a.id === id);
    };

    const getActivitiesByAccount = (accountId: string): Activity[] => {
        return activities.filter((a) => a.accountId === accountId);
    };

    const getActivitiesByOrganization = (organizationId: string | null): Activity[] => {
        if (!organizationId) {
            return activities;
        }
        return activities.filter((a) => a.organizationId === organizationId);
    };

    const createActivity = async (data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Promise<Activity> => {
        try {
            const newActivity = await apiClient.post<Activity>("/api/v1/activities", data);
            setActivities((prev) => [...prev, newActivity]);
            return newActivity;
        } catch (err) {
            console.error("Erro ao criar activity:", err);
            throw err;
        }
    };

    const updateActivity = async (id: string, data: Partial<Activity>): Promise<void> => {
        try {
            const updatedActivity = await apiClient.put<Activity>(`/api/v1/activities/${id}`, data);
            setActivities((prev) =>
                prev.map((a) => (a.id === id ? updatedActivity : a))
            );
        } catch (err) {
            console.error("Erro ao atualizar activity:", err);
            throw err;
        }
    };

    const deleteActivity = async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/api/v1/activities/${id}`);
            setActivities((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error("Erro ao deletar activity:", err);
            throw err;
        }
    };

    const completeActivity = async (id: string): Promise<void> => {
        await updateActivity(id, {
            status: "completed",
            completedAt: new Date().toISOString(),
        });
    };

    const updateActivityStatus = async (id: string, newStatus: Activity["status"]): Promise<void> => {
        const updates: Partial<Activity> = { status: newStatus };
        if (newStatus === "completed") {
            updates.completedAt = new Date().toISOString();
        }
        await updateActivity(id, updates);
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
        loading,
        error,
        getActivity,
        getActivitiesByAccount,
        getActivitiesByOrganization,
        createActivity,
        updateActivity,
        deleteActivity,
        completeActivity,
        updateActivityStatus,
        getStats,
        fetchActivities, // Exposed for manual refresh
    };
}

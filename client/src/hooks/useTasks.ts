/**
 * Hook para gerenciar Tasks
 */
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../api";

export interface Task {
    id: string;
    organizationId: string; // ID da organização dona desta task
    accountId?: string;
    title: string;
    description: string;
    assignee: string; // CSM ID
    priority: "low" | "medium" | "high" | "urgent";
    status: "todo" | "in-progress" | "completed" | "cancelled";
    dueDate: string;
    completedAt?: string; // Changed from completedDate to match API
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks
    const fetchTasks = useCallback(async (organizationId?: string) => {
        setLoading(true);
        try {
            // TODO: Get organizationId from auth context if not provided
            // For now, we assume it's passed or we fetch all (backend filters by user's org)
            // But backend requires organizationId param? 
            // server/main.py: list_tasks(skip, limit, current_user, db) -> uses current_user.organization_id
            // It does NOT require organizationId param in query.
            // So we can just call /api/v1/tasks

            const data = await apiClient.get<Task[]>("/api/v1/tasks");
            setTasks(data);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar tasks:", err);
            setError("Falha ao carregar tarefas");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const getTask = (id: string): Task | undefined => {
        return tasks.find((t) => t.id === id);
    };

    const getTasksByAccount = (accountId: string): Task[] => {
        return tasks.filter((t) => t.accountId === accountId);
    };

    const getTasksByOrganization = (organizationId: string | null): Task[] => {
        if (!organizationId) {
            return tasks;
        }
        return tasks.filter((t) => t.organizationId === organizationId);
    };

    const createTask = async (data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> => {
        try {
            // Backend expects TaskCreate schema
            // TaskCreate: title, description, status, priority, assignee, due_date, account_id
            // We need to map data to match backend expectations if needed.
            // But apiClient sends JSON, and backend uses Pydantic with alias generator (camelCase).
            // So sending camelCase keys should work.

            const newTask = await apiClient.post<Task>("/api/v1/tasks", data);
            setTasks((prev) => [...prev, newTask]);
            return newTask;
        } catch (err) {
            console.error("Erro ao criar task:", err);
            throw err;
        }
    };

    const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
        try {
            const updatedTask = await apiClient.put<Task>(`/api/v1/tasks/${id}`, data);
            setTasks((prev) =>
                prev.map((t) => (t.id === id ? updatedTask : t))
            );
        } catch (err) {
            console.error("Erro ao atualizar task:", err);
            throw err;
        }
    };

    const deleteTask = async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/api/v1/tasks/${id}`);
            setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            console.error("Erro ao deletar task:", err);
            throw err;
        }
    };

    const completeTask = async (id: string): Promise<void> => {
        await updateTask(id, {
            status: "completed",
            completedAt: new Date().toISOString(),
        });
    };

    const updateTaskStatus = async (id: string, newStatus: Task["status"]): Promise<void> => {
        const updates: Partial<Task> = { status: newStatus };
        if (newStatus === "completed") {
            updates.completedAt = new Date().toISOString();
        }
        await updateTask(id, updates);
    };

    // Estatísticas
    const getStats = () => {
        const total = tasks.length;
        const todo = tasks.filter((t) => t.status === "todo").length;
        const inProgress = tasks.filter((t) => t.status === "in-progress").length;
        const completed = tasks.filter((t) => t.status === "completed").length;

        const now = new Date();
        const overdue = tasks.filter(
            (t) => t.status !== "completed" && new Date(t.dueDate) < now
        ).length;

        const byPriority = {
            urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length,
            high: tasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
            medium: tasks.filter((t) => t.priority === "medium" && t.status !== "completed").length,
            low: tasks.filter((t) => t.priority === "low" && t.status !== "completed").length,
        };

        return {
            total,
            todo,
            inProgress,
            completed,
            overdue,
            byPriority,
        };
    };

    return {
        tasks,
        loading,
        error,
        getTask,
        getTasksByAccount,
        getTasksByOrganization,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        updateTaskStatus,
        getStats,
        fetchTasks, // Exposed for manual refresh
    };
}

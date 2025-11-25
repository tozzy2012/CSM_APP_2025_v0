import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiClient } from "../api";

export interface Task {
  id: string;
  accountId?: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "completed" | "cancelled";
  priority: "urgent" | "high" | "medium" | "low";
  assignee?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  createTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task["status"]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByAccount: (accountId: string) => Task[];
  getStats: () => { total: number; todo: number; inProgress: number; completed: number; overdue: number };
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { getAuthHeaders } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const data = await apiClient.get<Task[]>("/api/v1/tasks");
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log("Creating task with data:", data);
      const newTask = await apiClient.post<Task>("/api/v1/tasks", {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignee: data.assignee,
        due_date: data.dueDate,
        account_id: data.accountId,
      });

      console.log("New task created:", newTask);
      setTasks((prev) => [newTask, ...prev]);
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      const updated = await apiClient.put<Task>(`/api/v1/tasks/${id}`, data);
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updated : task))
      );
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const updateTaskStatus = async (id: string, status: Task["status"]) => {
    await updateTask(id, {
      status,
      completedAt: status === "completed" ? new Date().toISOString() : undefined
    });
  };

  const deleteTask = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/tasks/${id}`);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const getTasksByAccount = (accountId: string) => {
    return tasks.filter((task) => task.accountId === accountId);
  };

  const getStats = () => {
    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled" && new Date(t.dueDate) < now
    ).length;

    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue,
    };
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        getTasksByAccount,
        getStats,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasksContext must be used within TasksProvider");
  }
  return context;
}

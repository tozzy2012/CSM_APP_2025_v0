/**
 * Hook para gerenciar Tasks
 */
import { useState, useEffect } from "react";

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
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const STORAGE_KEY = "zapper_tasks";

// Dados iniciais (vazio - tasks devem ser criadas com organizationId)
const initialTasks: Task[] = [
  /*
  {
    id: "1",
    accountId: "1",
    title: "Preparar apresentação QBR",
    description: "Criar slides com métricas e insights do Q1",
    assignee: "1",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-04-10",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-05",
    createdBy: "1",
  },
  {
    id: "2",
    accountId: "2",
    title: "Agendar call de onboarding",
    description: "Marcar reunião com stakeholders",
    assignee: "2",
    priority: "medium",
    status: "completed",
    dueDate: "2024-03-08",
    completedDate: "2024-03-07",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-07",
    createdBy: "2",
  },
  {
    id: "3",
    title: "Revisar documentação de produto",
    description: "Atualizar guias de onboarding",
    assignee: "1",
    priority: "low",
    status: "todo",
    dueDate: "2024-04-20",
    createdAt: "2024-03-10",
    updatedAt: "2024-03-10",
    createdBy: "1",
  },*/
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar tasks:", error);
        setTasks(initialTasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
      }
    } else {
      setTasks(initialTasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const getTask = (id: string): Task | undefined => {
    return tasks.find((t) => t.id === id);
  };

  const getTasksByAccount = (accountId: string): Task[] => {
    return tasks.filter((t) => t.accountId === accountId);
  };

  const getTasksByOrganization = (organizationId: string | null): Task[] => {
    if (!organizationId) {
      // Super Admin vê todas as tasks
      return tasks;
    }
    return tasks.filter((t) => t.organizationId === organizationId);
  };

  const createTask = (data: Omit<Task, "id" | "createdAt" | "updatedAt">): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>): void => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const deleteTask = (id: string): void => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completeTask = (id: string): void => {
    updateTask(id, {
      status: "completed",
      completedDate: new Date().toISOString(),
    });
  };

  const updateTaskStatus = (id: string, newStatus: Task["status"]): void => {
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "completed") {
      updates.completedDate = new Date().toISOString();
    }
    updateTask(id, updates);
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
    getTask,
    getTasksByAccount,
    getTasksByOrganization,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    updateTaskStatus,
    getStats,
  };
}

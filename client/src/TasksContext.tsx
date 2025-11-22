 * Tasks Context
 */
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, Task } from "@/hooks/useTasks";

interface TasksContextType {
  tasks: Task[];
  getTask: (id: string) => Task | undefined;
  getTasksByAccount: (accountId: string) => Task[];
  createTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  updateTaskStatus: (id: string, newStatus: Task["status"]) => void;
  getStats: () => {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const tasksData = useTasks();

  // Filtrar tasks por organização
  const filteredTasks = useMemo(() => {
    // Super Admin vê todas as tasks
    if (currentUser?.role === "SUPER_ADMIN") {
      return tasksData.tasks;
    }
    // Admin da Org e CSM veem apenas tasks da sua organização
    if (currentUser?.organizationId) {
      return tasksData.getTasksByOrganization(currentUser.organizationId);
    }
    return [];
  }, [tasksData.tasks, currentUser]);

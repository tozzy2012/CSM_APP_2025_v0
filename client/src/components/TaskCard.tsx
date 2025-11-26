/**
 * TaskCard Component
 * Card de tarefa com cliente como informação principal
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import type { Task } from "@/contexts/TasksContext";

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  accountName?: string;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  isOverdue?: boolean;
}

export default function TaskCard({
  task,
  assigneeName,
  accountName,
  onStatusChange,
  onDelete,
  onEdit,
  isOverdue = false,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: "Urgente",
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: "A Fazer",
      "in-progress": "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "todo":
        return "outline";
      case "cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${isOverdue ? "border-red-500 bg-red-50 dark:bg-red-950" : "border-border"
        } ${task.status === "completed" ? "opacity-75" : ""}`}
    >
      {/* Header - Cliente como informação principal */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 mt-1.5`} />
          <div className="flex-1 min-w-0">
            {/* CLIENTE - Informação Principal */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">
                {accountName || "Sem cliente"}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getPriorityLabel(task.priority)}
              </Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
            </div>
            {/* AÇÃO - Informação Secundária */}
            <p className={`text-sm text-muted-foreground ${task.status === "completed" ? "line-through" : ""}`}>
              {task.title}
            </p>

            {/* CSM e Data - Destaque para o CSM */}
            <div className="flex items-center gap-4 mt-3">
              {assigneeName && (
                <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-md">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{assigneeName}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>

          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task)}
            >
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Excluir
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Due Date (if pending) */}
          {task.status !== "completed" && task.status !== "cancelled" && task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Prazo:</span>
              <span className="text-muted-foreground">{formatDate(task.dueDate)}</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Atrasada
                </Badge>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            {task.status === "todo" && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await onStatusChange(task.id, "in-progress");
                  } catch (error) {
                    console.error("Error changing status:", error);
                  }
                }}
              >
                Iniciar
              </Button>
            )}
            {task.status === "in-progress" && (
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    await onStatusChange(task.id, "completed");
                  } catch (error) {
                    console.error("Error changing status:", error);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Concluir
              </Button>
            )}
            {(task.status === "todo" || task.status === "in-progress") && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await onStatusChange(task.id, "cancelled");
                  } catch (error) {
                    console.error("Error changing status:", error);
                  }
                }}
              >
                Cancelar
              </Button>
            )}

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>
                  Marcar como A Fazer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "in-progress")}>
                  Marcar como Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "completed")}>
                  Marcar como Concluída
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "cancelled")}>
                  Cancelar Tarefa
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-red-600"
                  >
                    Excluir Tarefa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
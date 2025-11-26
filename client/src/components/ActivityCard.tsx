/**
 * ActivityCard Component
 * Card de atividade com cliente como informação principal
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
  Mail,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
  Users,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Activity as ActivityIcon,
} from "lucide-react";
import type { Activity } from "@/hooks/useActivities";

interface ActivityCardProps {
  activity: Activity;
  assigneeName?: string;
  accountName?: string;
  teamName?: string;
  onStatusChange: (activityId: string, newStatus: Activity["status"]) => void;
  onDelete?: (activityId: string) => void;
  onEdit?: (activity: Activity) => void;
}

export default function ActivityCard({
  activity,
  assigneeName,
  accountName,
  teamName,
  onStatusChange,
  onDelete,
  onEdit,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "call":
        return <Phone className="w-4 h-4" />;
      case "note":
        return <MessageSquare className="w-4 h-4" />;
      case "meeting":
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      call: "Chamada",
      note: "Nota",
      meeting: "Reunião",
      system: "Sistema",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-500";
      case "call":
        return "bg-green-500";
      case "note":
        return "bg-yellow-500";
      case "meeting":
        return "bg-purple-500";
      case "system":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
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
      case "pending":
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md border-border ${activity.status === "completed" ? "opacity-75" : ""
        }`}
    >
      {/* Header - Cliente como informação principal */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={`p-2 rounded ${getTypeColor(activity.type)} text-white flex-shrink-0`}>
            {getTypeIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            {/* CLIENTE - Informação Principal */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-foreground">
                {accountName || "Sem cliente"}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(activity.type)}
              </Badge>
            </div>
            {/* AÇÃO - Informação Secundária */}
            <p className={`text-sm text-muted-foreground ${activity.status === "completed" ? "line-through" : ""}`}>
              {activity.title}
            </p>
            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {formatDate(activity.dueDate)}
              </div>
              {assigneeName && (
                <div className="flex items-center gap-2 bg-secondary/20 px-2 py-1 rounded-full">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{assigneeName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={getStatusColor(activity.status)}>{getStatusLabel(activity.status)}</Badge>

          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(activity)}
            >
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(activity.id)}
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
          {activity.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          )}

          {/* Team */}
          {teamName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Time:</span>
              <span className="text-muted-foreground">{teamName}</span>
            </div>
          )}

          {/* Due Date (if pending) */}
          {activity.status === "pending" && activity.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Prazo:</span>
              <span className="text-muted-foreground">{formatDate(activity.dueDate)}</span>
              {new Date(activity.dueDate) < new Date() && (
                <Badge variant="destructive" className="text-xs">
                  Atrasada
                </Badge>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            {activity.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await onStatusChange(activity.id, "in-progress");
                  } catch (error) {
                    console.error("Error changing status:", error);
                  }
                }}
              >
                Iniciar
              </Button>
            )}
            {activity.status === "in-progress" && (
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    await onStatusChange(activity.id, "completed");
                  } catch (error) {
                    console.error("Error changing status:", error);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Concluir
              </Button>
            )}
            {(activity.status === "pending" || activity.status === "in-progress") && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await onStatusChange(activity.id, "cancelled");
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
                <DropdownMenuItem onClick={() => onStatusChange(activity.id, "pending")}>
                  Marcar como Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(activity.id, "in-progress")}>
                  Marcar como Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(activity.id, "completed")}>
                  Marcar como Concluída
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(activity.id, "cancelled")}>
                  Cancelar Atividade
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(activity.id)}
                    className="text-red-600"
                  >
                    Excluir Atividade
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

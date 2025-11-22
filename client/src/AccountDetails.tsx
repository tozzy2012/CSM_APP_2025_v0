/**
 * Account Details Page
 * Customer-360 View com Activities e Tasks integrados
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle,
  Users,
  DollarSign,
  Plus,
  Clock,
  CheckCircle2,
  ListChecks,
  CheckSquare,
} from "lucide-react";
import { useRoute } from "wouter";
import { useState } from "react";
import { useAccountsContext } from "@/contexts/AccountsContext";
import { useActivitiesContext } from "@/contexts/ActivitiesContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import AddActivityDialog from "@/components/AddActivityDialog";
import AddTaskDialog from "@/components/AddTaskDialog";
import TaskCard from "@/components/TaskCard";
import ActivityCard from "@/components/ActivityCard";
import EditAccountDialog from "@/components/EditAccountDialog";

export default function AccountDetails() {
  const [, params] = useRoute("/accounts/:id");
  const accountId = params?.id || "";
  
  const { getAccount } = useAccountsContext();
  const { getActivitiesByAccount, updateActivityStatus, deleteActivity } = useActivitiesContext();
  const { getTasksByAccount, updateTaskStatus, deleteTask } = useTasksContext();
  const { getCSM, getTeam } = useTeamContext();
  const { template, getProgress, getProgressStats, completeTask, uncompleteTask, startOnboarding } = useOnboarding();
  
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  const account = getAccount(accountId);
  const activities = getActivitiesByAccount(accountId);
  const tasks = getTasksByAccount(accountId);
  
  // Iniciar onboarding se necessário
  const progress = getProgress(accountId);
  if (account && !progress) {
    startOnboarding(accountId);
  }
  
  const progressStats = getProgressStats(accountId);
  
  if (!account) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Account não encontrado</h2>
          <p className="text-muted-foreground">O account que você está procurando não existe.</p>
        </div>
      </div>
    );
  }
  
  const csm = getCSM(account.csm);
  
  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "at-risk":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Users className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };
  
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      note: "Nota",
      call: "Ligação",
      email: "Email",
      meeting: "Reunião",
      system: "Sistema",
    };
    return labels[type] || type;
  };
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      "in-progress": "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
      todo: "A Fazer",
    };
    return labels[status] || status;
  };
  
  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
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
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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
  
  const isOverdue = (dueDate: string, status: string) => {
    if (status === "completed" || status === "cancelled") return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <p className="text-muted-foreground mt-1">
            {account.industry} • {account.stage}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(account.healthStatus)}`} />
            <span className="font-medium">Health Score: {account.healthScore}/100</span>
          </div>
          <EditAccountDialog account={account} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold">R$ {account.mrr.toLocaleString("pt-BR")}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CSM</p>
              <p className="text-lg font-semibold">{csm?.name || "N/A"}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Activities</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold">{tasks.filter(t => t.status !== "completed").length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding ({progressStats.completed}/{progressStats.total})
          </TabsTrigger>
          <TabsTrigger value="activities">
            Activities ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({tasks.filter(t => t.status !== "completed").length})
          </TabsTrigger>
          <TabsTrigger value="health">Health Score</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Indústria</p>
                <p className="font-medium">{account.industry || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">
                  {account.website ? (
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {account.website}
                    </a>
                  ) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número de Funcionários</p>
                <p className="font-medium">{account.employees || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estágio</p>
                <Badge>{account.stage}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Conta</p>
                <Badge variant="outline">{account.type || "N/A"}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status do Pipeline</p>
                <Badge variant="outline">{account.status || "N/A"}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="font-medium text-green-600">R$ {account.mrr.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor do Contrato</p>
                <p className="font-medium">R$ {account.contractValue?.toLocaleString("pt-BR") || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Início do Contrato</p>
                <p className="font-medium">{account.contractStart ? formatDate(account.contractStart) : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fim do Contrato</p>
                <p className="font-medium">{account.contractEnd ? formatDate(account.contractEnd) : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="font-medium">{account.healthScore}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status de Saúde</p>
                <Badge className={getHealthColor(account.healthStatus)}>
                  {account.healthStatus === "healthy" ? "Saudável" : account.healthStatus === "at-risk" ? "Em Risco" : "Crítico"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="p-2 bg-accent rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {getActivityTypeLabel(activity.type)} • {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                    {getStatusLabel(activity.status)}
                  </Badge>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma atividade registrada ainda
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Progresso do Onboarding</h3>
                <Badge variant={progressStats.isComplete ? "default" : "secondary"}>
                  {progressStats.percentage}% Completo
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressStats.percentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {progressStats.completed} de {progressStats.total} etapas concluídas
                {progressStats.isComplete && progressStats.timeToValue && (
                  <span className="ml-2 text-green-600 font-medium">
                    • Concluído em {progressStats.timeToValue} dias
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-3">
              {template.map((task) => {
                const isCompleted = progress?.completedTasks.some(t => t.taskId === task.id);
                const completedTask = progress?.completedTasks.find(t => t.taskId === task.id);
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (isCompleted) {
                          uncompleteTask(accountId, task.id);
                        } else {
                          completeTask(accountId, task.id);
                        }
                      }}
                      className="mt-1"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${
                          isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {task.category === 'setup' && 'Configuração'}
                          {task.category === 'training' && 'Treinamento'}
                          {task.category === 'integration' && 'Integração'}
                          {task.category === 'adoption' && 'Adoção'}
                        </Badge>
                      </div>
                      <p className={`text-sm ${
                        isCompleted ? 'text-green-700' : 'text-muted-foreground'
                      }`}>
                        {task.description}
                      </p>
                      {completedTask && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Concluído em {new Date(completedTask.completedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Todas as Atividades</h3>
              <Button onClick={() => setIsAddActivityOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Atividade
              </Button>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => {
                const assignee = getCSM(activity.assignee);
                const team = getTeam(activity.team);
                
                return (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    assigneeName={assignee?.name}
                    accountName={account?.name}
                    teamName={team?.name}
                    onStatusChange={updateActivityStatus}
                    onDelete={deleteActivity}
                  />
                );
              })}
              {activities.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhuma atividade registrada</p>
                  <Button className="mt-4" onClick={() => setIsAddActivityOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Atividade
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tarefas</h3>
              <Button onClick={() => setIsAddTaskOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => {
                const assignee = getCSM(task.assignee);
                const overdue = isOverdue(task.dueDate, task.status);
                
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assigneeName={assignee?.name}
                    accountName={account.name}
                    onStatusChange={updateTaskStatus}
                    onDelete={deleteTask}
                    isOverdue={overdue}
                  />
                );
              })}
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhuma tarefa criada</p>
                  <Button className="mt-4" onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Tarefa
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Health Score Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Health Score</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getHealthColor(account.healthStatus)} bg-opacity-20 mx-auto mb-4`}>
                  <span className="text-4xl font-bold">{account.healthScore}</span>
                </div>
                <p className="text-lg font-semibold capitalize">{account.healthStatus}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado em engajamento, adoção e satisfação
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddActivityDialog
        open={isAddActivityOpen}
        onOpenChange={setIsAddActivityOpen}
        accountId={accountId}
      />
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        accountId={accountId}
      />
    </div>
  );
}

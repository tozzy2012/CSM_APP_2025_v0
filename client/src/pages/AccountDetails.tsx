/**
 * Account Details Page
 * Customer-360 View
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { useAccountsContext } from "@/contexts/AccountsContext";
import { useActivitiesContext } from "@/contexts/ActivitiesContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import EditAccountDialog from "@/components/EditAccountDialog";
import HealthScoreButton from "@/components/HealthScoreButton";
import AddActivityDialog from "@/components/AddActivityDialog";
import AddTaskDialog from "@/components/AddTaskDialog";
import ActivityCard from "@/components/ActivityCard";
import TaskCard from "@/components/TaskCard";

export default function AccountDetails() {
  const [, params] = useRoute("/accounts/:id");
  const accountId = params?.id || "";

  const { accounts } = useAccountsContext();
  const { activities, updateActivityStatus, deleteActivity } = useActivitiesContext();
  const { tasks, updateTaskStatus, deleteTask } = useTasksContext();
  const { getCSM, getTeam } = useTeamContext();
  const { template, completeTask, uncompleteTask, getProgressStats, isTaskComplete } = useOnboarding();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Filter activities and tasks for this account
  const accountActivities = activities.filter(a => a.accountId === accountId);
  const accountTasks = tasks.filter(t => t.accountId === accountId);

  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Account não encontrado</h2>
          <p className="text-muted-foreground">O account que você está procurando não existe.</p>
          <Link href="/accounts">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Accounts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <p className="text-muted-foreground mt-1">
            {account.industry} • {account.stage}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(account.healthScore || 0)}`} />
            <span className="font-medium">Health Score: {account.healthScore || 0}/100</span>
          </div>
          <Button onClick={() => setIsEditOpen(true)}>
            Editar Account
          </Button>
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
              <p className="text-lg font-semibold">{account.csm || "N/A"}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="text-lg font-semibold">{account.type || "N/A"}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{account.status || "N/A"}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Atividades ({accountActivities.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({accountTasks.length})</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
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
                <p className="font-medium">{account.healthScore || 0}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CSM Responsável</p>
                <p className="font-medium">{account.csm || "N/A"}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Atividades do Cliente</h3>
            <Button onClick={() => setIsAddActivityOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
          <Card className="p-6">
            {accountActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma atividade registrada para este cliente</p>
                <Button onClick={() => setIsAddActivityOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Atividade
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accountActivities.map((activity) => {
                  const assignee = getCSM(activity.assignee);
                  const team = getTeam(activity.team);
                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      assigneeName={assignee?.name}
                      accountName={account.name}
                      teamName={team?.name}
                      onStatusChange={updateActivityStatus}
                      onDelete={deleteActivity}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tarefas do Cliente</h3>
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
          <Card className="p-6">
            {accountTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma tarefa registrada para este cliente</p>
                <Button onClick={() => setIsAddTaskOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accountTasks.map((task) => {
                  const assignee = getCSM(task.assignee);
                  const isOverdue = task.status !== "completed" && task.status !== "cancelled" && new Date(task.dueDate) < new Date();
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={assignee?.name}
                      accountName={account.name}
                      onStatusChange={updateTaskStatus}
                      onDelete={deleteTask}
                      isOverdue={isOverdue}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Checklist de Onboarding</h3>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">
                    {getProgressStats(accountId).completed}/{getProgressStats(accountId).total} - {getProgressStats(accountId).percentage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${getProgressStats(accountId).percentage}%` }}
                  />
                </div>
                {getProgressStats(accountId).isComplete && getProgressStats(accountId).timeToValue && (
                  <p className="text-sm text-green-600 font-semibold">
                    ✅ Onboarding completo em {getProgressStats(accountId).timeToValue} dias!
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Checklist Items Grouped by Category */}
              <div className="space-y-6">
                {['setup', 'training', 'integration', 'adoption'].map((category) => {
                  const categoryTasks = template.filter(t => t.category === category);
                  if (categoryTasks.length === 0) return null;

                  const categoryLabels: Record<string, { label: string; color: string }> = {
                    setup: { label: '🔧 Configuração', color: 'text-blue-600' },
                    training: { label: '📚 Treinamento', color: 'text-purple-600' },
                    integration: { label: '🔗 Integração', color: 'text-green-600' },
                    adoption: { label: '🚀 Adoção', color: 'text-orange-600' },
                  };

                  return (
                    <div key={category}>
                      <h4 className={`font-semibold mb-3 ${categoryLabels[category].color}`}>
                        {categoryLabels[category].label}
                      </h4>
                      <div className="space-y-2">
                        {categoryTasks.map((task) => {
                          const isComplete = isTaskComplete(accountId, task.id);
                          return (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                if (isComplete) {
                                  uncompleteTask(accountId, task.id);
                                } else {
                                  completeTask(accountId, task.id);
                                }
                              }}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className={`font-medium ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Health Score Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Health Score</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getHealthColor(account.healthScore || 0)} bg-opacity-20 mx-auto mb-4`}>
                  <span className="text-4xl font-bold">{account.healthScore || 0}</span>
                </div>
                <p className="text-lg font-semibold">
                  {(account.healthScore || 0) >= 70 ? 'Saudável' : (account.healthScore || 0) >= 50 ? 'Atenção' : 'Crítico'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado em engajamento, adoção e satisfação
                </p>
                <div className="mt-6">
                  <HealthScoreButton accountId={accountId} variant="inline" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isEditOpen && (
        <EditAccountDialog
          account={account}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}

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

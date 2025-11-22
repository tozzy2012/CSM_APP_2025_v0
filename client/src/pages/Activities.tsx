/**
 * Activities Page
 * Gerenciamento completo de atividades com visão resumida e expansível
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Mail, Phone, MessageSquare, Calendar as CalendarIcon, Activity as ActivityIcon } from "lucide-react";
import { useActivitiesContext, type Activity } from "@/contexts/ActivitiesContext";
import { useAccountsContext } from "@/contexts/AccountsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import AddActivityDialog from "@/components/AddActivityDialog";
import EditActivityDialog from "@/components/EditActivityDialog";
import ActivityCard from "@/components/ActivityCard";

export default function Activities() {
  const { activities, updateActivityStatus, deleteActivity, getStats } = useActivitiesContext();
  const { getAccount } = useAccountsContext();
  const { getCSM, getTeam } = useTeamContext();

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditActivityOpen(true);
  };

  const stats = getStats();

  // Filtrar activities
  const filteredActivities = activities.filter((activity) => {
    if (typeFilter !== "all" && activity.type !== typeFilter) return false;
    if (statusFilter !== "all" && activity.status !== statusFilter) return false;
    return true;
  });

  // Separar por tipo
  const emailActivities = filteredActivities.filter((a) => a.type === "email");
  const callActivities = filteredActivities.filter((a) => a.type === "call");
  const noteActivities = filteredActivities.filter((a) => a.type === "note");
  const meetingActivities = filteredActivities.filter((a) => a.type === "meeting");
  const pendingActivities = filteredActivities.filter((a) => a.status === "pending");
  const completedActivities = filteredActivities.filter((a) => a.status === "completed");

  const renderActivityList = (activityList: typeof activities, emptyMessage: string) => {
    if (activityList.length === 0) {
      return (
        <div className="text-center py-8">
          <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activityList.map((activity) => {
          const assignee = getCSM(activity.assignee);
          const account = getAccount(activity.accountId);
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
              onEdit={handleEditActivity}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as interações com clientes
          </p>
        </div>
        <Button onClick={() => setIsAddActivityOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <ActivityIcon className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Emails</p>
              <p className="text-2xl font-bold">{emailActivities.length}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chamadas</p>
              <p className="text-2xl font-bold">{callActivities.length}</p>
            </div>
            <Phone className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reuniões</p>
              <p className="text-2xl font-bold">{meetingActivities.length}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="text-2xl font-bold">{noteActivities.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Chamada</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in-progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activities Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({filteredActivities.length})</TabsTrigger>
          <TabsTrigger value="by-client">Por Cliente</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingActivities.length})</TabsTrigger>
          <TabsTrigger value="email">Emails ({emailActivities.length})</TabsTrigger>
          <TabsTrigger value="call">Chamadas ({callActivities.length})</TabsTrigger>
          <TabsTrigger value="meeting">Reuniões ({meetingActivities.length})</TabsTrigger>
          <TabsTrigger value="note">Notas ({noteActivities.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedActivities.length})</TabsTrigger>
        </TabsList>

        {/* All Activities */}
        <TabsContent value="all" className="space-y-4">
          <Card className="p-6">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
                <Button className="mt-4" onClick={() => setIsAddActivityOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Atividade
                </Button>
              </div>
            ) : (
              renderActivityList(filteredActivities, "Nenhuma atividade encontrada")
            )}
          </Card>
        </TabsContent>

        {/* By Client - Grouped View */}
        <TabsContent value="by-client" className="space-y-4">
          {(() => {
            // Agrupar activities por account
            const activitiesByAccount = filteredActivities.reduce((acc, activity) => {
              const accountId = activity.accountId;
              if (!acc[accountId]) {
                acc[accountId] = [];
              }
              acc[accountId].push(activity);
              return acc;
            }, {} as Record<string, typeof activities>);

            // Ordenar accounts por número de activities (decrescente)
            const sortedAccounts = Object.entries(activitiesByAccount).sort(
              ([, a], [, b]) => b.length - a.length
            );

            if (sortedAccounts.length === 0) {
              return (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
                  </div>
                </Card>
              );
            }

            return sortedAccounts.map(([accountId, accountActivities]) => {
              const account = getAccount(accountId);
              if (!account) return null;

              return (
                <Card key={accountId} className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{account.name}</h3>
                      <Badge variant="secondary">
                        {accountActivities.length} {accountActivities.length === 1 ? 'atividade' : 'atividades'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {account.type} • MRR: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.mrr)}
                    </p>
                  </div>
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
                          onEdit={handleEditActivity}
                        />
                      );
                    })}
                  </div>
                </Card>
              );
            });
          })()}
        </TabsContent>

        {/* Pending Activities */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(pendingActivities, "Nenhuma atividade pendente")}
          </Card>
        </TabsContent>

        {/* Email Activities */}
        <TabsContent value="email" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(emailActivities, "Nenhum email registrado")}
          </Card>
        </TabsContent>

        {/* Call Activities */}
        <TabsContent value="call" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(callActivities, "Nenhuma chamada registrada")}
          </Card>
        </TabsContent>

        {/* Meeting Activities */}
        <TabsContent value="meeting" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(meetingActivities, "Nenhuma reunião registrada")}
          </Card>
        </TabsContent>

        {/* Note Activities */}
        <TabsContent value="note" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(noteActivities, "Nenhuma nota registrada")}
          </Card>
        </TabsContent>

        {/* Completed Activities */}
        <TabsContent value="completed" className="space-y-4">
          <Card className="p-6">
            {renderActivityList(completedActivities, "Nenhuma atividade concluída")}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Activity Dialog */}
      <AddActivityDialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen} />

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <EditActivityDialog
          open={isEditActivityOpen}
          onOpenChange={setIsEditActivityOpen}
          activity={editingActivity}
        />
      )}
    </div>
  );
}

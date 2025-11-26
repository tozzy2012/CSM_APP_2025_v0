/**
 * Tasks Page
 * Gerenciamento completo de tarefas com visão resumida e expansível
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
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useTasksContext, type Task } from "@/contexts/TasksContext";
import { useAccountsContext } from "@/contexts/AccountsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import AddTaskDialog from "@/components/AddTaskDialog";
import EditTaskDialog from "@/components/EditTaskDialog";
import TaskCard from "@/components/TaskCard";

export default function Tasks() {
  const { tasks, updateTaskStatus, deleteTask, getStats } = useTasksContext();
  const { getAccount } = useAccountsContext();
  const { csms, getCSM } = useTeamContext(); // Get team members for filter

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [csmFilter, setCsmFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };

  const stats = getStats();

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "completed" || status === "cancelled") return false;
    return new Date(dueDate) < new Date();
  };

  const checkDateFilter = (taskDate: string, filter: string) => {
    if (filter === "all") return true;

    const date = new Date(taskDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDay = new Date(date);
    taskDay.setHours(0, 0, 0, 0);

    if (filter === "today") {
      return taskDay.getTime() === today.getTime();
    }

    if (filter === "this-week") {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay()); // Sunday
      const lastDay = new Date(today);
      lastDay.setDate(today.getDate() - today.getDay() + 6); // Saturday
      return taskDay >= firstDay && taskDay <= lastDay;
    }

    if (filter === "overdue") {
      return date < new Date() && taskDay.getTime() !== today.getTime();
    }

    return true;
  };

  // Filtrar tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (csmFilter !== "all" && task.assignee !== csmFilter) return false;
    if (dateFilter !== "all" && !checkDateFilter(task.dueDate, dateFilter)) return false;
    return true;
  });

  // Separar por status
  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const overdueTasks = filteredTasks.filter((t) => isOverdue(t.dueDate, t.status));

  const renderTaskList = (taskList: typeof tasks, emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task) => {
          const assignee = getCSM(task.assignee);
          const account = task.accountId ? getAccount(task.accountId) : null;
          const overdue = isOverdue(task.dueDate, task.status);

          return (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={assignee?.name}
              accountName={account?.name}
              onStatusChange={updateTaskStatus}
              onDelete={deleteTask}
              onEdit={handleEditTask}
              isOverdue={overdue}
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
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as suas tarefas e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
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
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Fazer</p>
              <p className="text-2xl font-bold">{stats.todo}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="todo">A Fazer</SelectItem>
                <SelectItem value="in-progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">CSM Responsável</label>
            <Select value={csmFilter} onValueChange={setCsmFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um CSM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {csms.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Data de Vencimento</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="this-week">Esta Semana</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="by-client">Por Cliente</TabsTrigger>
          <TabsTrigger value="todo">A Fazer ({todoTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">
            Em Andamento ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedTasks.length})</TabsTrigger>
        </TabsList>

        {/* All Tasks */}
        <TabsContent value="all" className="space-y-4">
          <Card className="p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                <Button className="mt-4" onClick={() => setIsAddTaskOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </div>
            ) : (
              renderTaskList(filteredTasks, "Nenhuma tarefa encontrada")
            )}
          </Card>
        </TabsContent>

        {/* By Client - Grouped View */}
        <TabsContent value="by-client" className="space-y-4">
          {(() => {
            // Agrupar tasks por account
            const tasksByAccount = filteredTasks.reduce((acc, task) => {
              const accountId = task.accountId || 'no-account';
              if (!acc[accountId]) {
                acc[accountId] = [];
              }
              acc[accountId].push(task);
              return acc;
            }, {} as Record<string, typeof tasks>);

            // Ordenar accounts por número de tasks (decrescente)
            const sortedAccounts = Object.entries(tasksByAccount)
              .filter(([accountId]) => accountId !== 'no-account')
              .sort(([, a], [, b]) => b.length - a.length);

            if (sortedAccounts.length === 0) {
              return (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                  </div>
                </Card>
              );
            }

            return sortedAccounts.map(([accountId, accountTasks]) => {
              const account = getAccount(accountId);
              if (!account) return null;

              const overdueTasks = accountTasks.filter(t => isOverdue(t.dueDate, t.status));
              const pendingTasks = accountTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

              return (
                <Card key={accountId} className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{account.name}</h3>
                      <div className="flex items-center gap-2">
                        {overdueTasks.length > 0 && (
                          <Badge variant="destructive">
                            {overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {accountTasks.length} {accountTasks.length === 1 ? 'tarefa' : 'tarefas'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {account.type} • MRR: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.mrr)} • {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {accountTasks.map((task) => {
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
                          onEdit={handleEditTask}
                          isOverdue={overdue}
                        />
                      );
                    })}
                  </div>
                </Card>
              );
            });
          })()}
        </TabsContent>

        {/* To Do Tasks */}
        <TabsContent value="todo" className="space-y-4">
          <Card className="p-6">
            {renderTaskList(todoTasks, "Nenhuma tarefa a fazer")}
          </Card>
        </TabsContent>

        {/* In Progress Tasks */}
        <TabsContent value="in-progress" className="space-y-4">
          <Card className="p-6">
            {renderTaskList(inProgressTasks, "Nenhuma tarefa em andamento")}
          </Card>
        </TabsContent>

        {/* Overdue Tasks */}
        <TabsContent value="overdue" className="space-y-4">
          <Card className="p-6">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p className="text-muted-foreground">Nenhuma tarefa atrasada! 🎉</p>
              </div>
            ) : (
              renderTaskList(overdueTasks, "")
            )}
          </Card>
        </TabsContent>

        {/* Completed Tasks */}
        <TabsContent value="completed" className="space-y-4">
          <Card className="p-6">
            {renderTaskList(completedTasks, "Nenhuma tarefa concluída ainda")}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          open={isEditTaskOpen}
          onOpenChange={setIsEditTaskOpen}
          task={editingTask}
        />
      )}
    </div>
  );
}

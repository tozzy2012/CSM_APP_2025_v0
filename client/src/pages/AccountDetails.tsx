/**
 * Account Details Page
 * Premium SaaS Design - Customer 360 View
 */
import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Globe,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  TrendingUp,
  Users,
  Activity as ActivityIcon,
  AlertCircle,
  Heart,
  ThumbsUp,
  Zap,
  Clock,
  Target,
  CalendarClock,
  TrendingDown,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAccountsContext } from "@/contexts/AccountsContext";
import { useActivitiesContext } from "@/contexts/ActivitiesContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useLatestHealthScore } from "@/hooks/useLatestHealthScore";
import { useHealthScoreDetails } from "@/hooks/useHealthScoreDetails";

import EditAccountDialog from "@/components/EditAccountDialog";
import AddActivityDialog from "@/components/AddActivityDialog";
import AddTaskDialog from "@/components/AddTaskDialog";
import ActivityCard from "@/components/ActivityCard";
import TaskCard from "@/components/TaskCard";
import AccountInsights from "@/components/AccountInsights";
import HealthScoreChart from "@/components/HealthScoreChart";
import QuestionResponsesChart from "@/components/QuestionResponsesChart";
import HealthScoreButton from "@/components/HealthScoreButton";

// Helper function to calculate contract value
const calculateContractValue = (mrr: number | null, contractStart: string | null, contractEnd: string | null): number => {
  if (!mrr || !contractStart || !contractEnd) return 0;

  const start = new Date(contractStart);
  const end = new Date(contractEnd);
  const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  return mrr * months;
};

export default function AccountDetails() {
  const [, params] = useRoute("/accounts/:id");
  const accountId = params?.id || "";

  const { accounts } = useAccountsContext();
  const { activities, updateActivityStatus, deleteActivity } = useActivitiesContext();
  const { tasks, updateTaskStatus, deleteTask } = useTasksContext();
  const { getCSM, getTeam } = useTeamContext();
  const { template, completeTask, uncompleteTask, getProgressStats, isTaskComplete } = useOnboarding();
  const { score: healthScore } = useLatestHealthScore(accountId);
  const { evaluation: healthScoreEvaluation } = useHealthScoreDetails(accountId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [scrollToId, setScrollToId] = useState<string | null>(null);

  // Handle scroll to item when switching tabs
  useEffect(() => {
    if (scrollToId && activeTab) {
      // Small timeout to allow tab content to mount
      setTimeout(() => {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
        }
        setScrollToId(null);
      }, 100);
    }
  }, [scrollToId, activeTab]);

  const account = accounts.find(a => a.id === accountId);

  // Use evaluated health score if available, otherwise use account's healthScore
  const displayHealthScore = healthScore || account?.healthScore || 0;

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Account não encontrado</h2>
        <p className="text-muted-foreground">O cliente que você procura não existe ou foi removido.</p>
        <Link href="/accounts">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Lista
          </Button>
        </Link>
      </div>
    );
  }

  // Filter data
  const accountActivities = activities.filter(a => a.accountId === accountId);
  const accountTasks = tasks.filter(t => t.accountId === accountId);
  const onboardingStats = getProgressStats(accountId);

  // Helpers
  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return "N/A";
    }
  };

  // Calculate total contract value based on MRR and contract duration
  const calculateContractValue = (mrr?: number, startDate?: string, endDate?: string): number => {
    if (!mrr || !startDate || !endDate) return 0;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Calculate difference in months
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

      // Return MRR * months
      return mrr * Math.max(months, 0);
    } catch {
      return 0;
    }
  };

  const csm = getCSM(account.csm || "");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation / Breadcrumbs */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/accounts" className="hover:text-foreground transition-colors">Accounts</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{account.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{account.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="rounded-md px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                  {account.type || "Cliente"}
                </Badge>
                <span>{account.industry}</span>
                <span>•</span>
                <a href={account.website} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                  <Globe className="w-3 h-3 mr-1" />
                  {account.website?.replace(/^https?:\/\//, '') || "N/A"}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HealthScoreButton accountId={accountId} variant="default" />
            <Button onClick={() => setIsEditOpen(true)} variant="outline">
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600">
                  Arquivar Cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Tabs Section - Now wrapping everything */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-blue-100/80 dark:bg-blue-900/40 p-1.5 rounded-xl gap-2 h-auto mb-8 border border-blue-200 dark:border-blue-800 shadow-sm">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg px-4 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="activities"
                  className="rounded-lg px-4 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                >
                  Atividades <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-blue-200/50 text-blue-700 group-data-[state=active]:bg-blue-50 group-data-[state=active]:text-blue-700">{accountActivities.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="rounded-lg px-4 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                >
                  Tarefas <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-blue-200/50 text-blue-700 group-data-[state=active]:bg-blue-50 group-data-[state=active]:text-blue-700">{accountTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="onboarding"
                  className="rounded-lg px-4 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                >
                  Onboarding
                </TabsTrigger>
                <TabsTrigger
                  value="health"
                  className="rounded-lg px-4 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
                >
                  Health Score
                </TabsTrigger>
              </TabsList>

              {/* Account Intelligence Section */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-primary" />
                    Account Intelligence
                  </h2>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    AI Powered
                  </Badge>
                </div>
                <AccountInsights accountId={accountId} />
              </section>

              <div className="mt-6">
                {/* OVERVIEW TAB - Premium Redesign */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* MRR Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR</p>
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className="text-2xl font-bold">R$ {(account.mrr || 0).toLocaleString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Days to Renewal Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Renovação</p>
                            {account.contractEnd ? (
                              <>
                                <div className="mt-2">
                                  <span className="text-2xl font-bold">
                                    {Math.max(0, Math.ceil((new Date(account.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">dias</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground mt-2 block">N/A</span>
                            )}
                          </div>
                          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <CalendarClock className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pending Activities Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Atividades</p>
                            <div className="mt-2">
                              <span className="text-2xl font-bold">{accountActivities.filter(a => a.status !== 'completed').length}</span>
                              <span className="text-xs text-muted-foreground ml-1">pendentes</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                            <ActivityIcon className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Overdue Tasks Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarefas</p>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-orange-600">
                                {accountTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">atrasadas</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Health Score Charts */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Health Score History Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico de Health Score</CardTitle>
                        <CardDescription>Evolução do score ao longo do tempo</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <HealthScoreChart accountId={accountId} />
                      </CardContent>
                    </Card>

                    {/* Question Responses Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Respostas das Pesquisas</CardTitle>
                        <CardDescription>Histórico de avaliações por pilar</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <QuestionResponsesChart accountId={accountId} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Two Column Layout: Timeline + Next Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Unified Timeline */}
                    <Card className="flex flex-col h-[500px]">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Timeline Recente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {/* 1. Overdue Tasks (High Priority) */}
                        {accountTasks
                          .filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date())
                          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                          .map(task => (
                            <div
                              key={task.id}
                              onClick={() => {
                                setActiveTab('tasks');
                                setScrollToId(task.id);
                              }}
                              className="flex gap-3 items-start border-l-2 border-red-300 pl-3 bg-red-50/50 dark:bg-red-900/10 p-2 rounded-r-lg cursor-pointer hover:bg-red-100/50 transition-colors group"
                            >
                              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 mt-1 group-hover:scale-105 transition-transform">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-red-900 dark:text-red-100 group-hover:underline">{task.title}</p>
                                <p className="text-xs text-red-700 dark:text-red-300">
                                  Vencido em: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 whitespace-nowrap">
                                Atrasado
                              </span>
                            </div>
                          ))}

                        {/* 2. History (Activities + Completed Tasks) */}
                        {[...accountActivities, ...accountTasks.filter(t => t.status === 'completed')]
                          .sort((a, b) => {
                            const dateA = 'activity_date' in a ? new Date(a.activity_date || a.createdAt) : new Date(a.updatedAt || a.dueDate);
                            const dateB = 'activity_date' in b ? new Date(b.activity_date || b.createdAt) : new Date(b.updatedAt || b.dueDate);
                            return dateB.getTime() - dateA.getTime();
                          })
                          .map((item) => {
                            const isActivity = 'type' in item; // Simple check, might need refinement based on actual props
                            // Better check: if it has 'activity_type' or similar.
                            // Assuming accountActivities items have 'type' or 'activity_type' and tasks don't (or have status)
                            // Based on previous code: const isActivity = 'type' in item;

                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(isActivity ? 'activities' : 'tasks');
                                  setScrollToId(item.id);
                                }}
                                className="flex gap-3 items-start border-l-2 border-muted pl-3 cursor-pointer hover:bg-muted/50 p-2 rounded-r-lg transition-colors group"
                              >
                                <div className={`p-2 rounded-lg ${isActivity ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-green-100 dark:bg-green-900/20'} group-hover:scale-105 transition-transform`}>
                                  {isActivity ? (
                                    <ActivityIcon className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {isActivity
                                      ? new Date(item.createdAt || item.activity_date).toLocaleDateString('pt-BR')
                                      : `Concluído em: ${new Date(item.updatedAt || item.dueDate).toLocaleDateString('pt-BR')}`
                                    }
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${isActivity ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20' : 'bg-green-100 text-green-700 dark:bg-green-900/20'
                                  }`}>
                                  {isActivity ? (item.type === 'call' ? 'Reunião' : item.type === 'email' ? 'Email' : 'Atividade') : 'Concluído'}
                                </span>
                              </div>
                            );
                          })}

                        <div className="pt-4 flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur pb-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsAddActivityOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Atividade
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsAddTaskOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tarefa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Next Actions & Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Próximas Ações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Overdue tasks */}
                          {accountTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length > 0 && (
                            <div className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                  {accountTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length} tarefa(s) atrasada(s)
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                                  Priorize a conclusão das tarefas pendentes
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Upcoming Tasks */}
                          {accountTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) >= new Date()).length > 0 && (
                            <div className="space-y-3 pt-2">
                              <p className="text-sm font-medium text-muted-foreground">Próximas Tarefas</p>
                              {accountTasks
                                .filter(t => t.status !== 'completed' && new Date(t.dueDate) >= new Date())
                                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                .slice(0, 5)
                                .map(task => (
                                  <div
                                    key={task.id}
                                    onClick={() => {
                                      setActiveTab('tasks');
                                      setScrollToId(task.id);
                                    }}
                                    className="flex gap-3 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer group"
                                  >
                                    <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-600 group-hover:scale-105 transition-transform">
                                      <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{task.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                      {task.priority === 'high' ? 'Alta' : 'Normal'}
                                    </Badge>
                                  </div>
                                ))
                              }
                            </div>
                          )}

                          {/* Health score alert */}
                          {displayHealthScore < 60 && (
                            <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30">
                              <TrendingDown className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                  Health Score em atenção
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-200 mt-1">
                                  Score atual: {displayHealthScore}/100. Agende um check-in.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Contract renewal approaching */}
                          {account.contractEnd && Math.ceil((new Date(account.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 90 && (
                            <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                              <CalendarClock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  Renovação se aproximando
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                                  Renova em {Math.ceil((new Date(account.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias. Prepare a proposta de renovação.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Positive reinforcement */}
                          {displayHealthScore >= 80 && accountTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length === 0 && (
                            <div className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                              <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Conta em excelente estado!
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                                  Continue o ótimo trabalho. Considere solicitar um case study ou referência.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* No alerts - encourage action */}
                          {accountTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length === 0 &&
                            displayHealthScore >= 60 &&
                            (!account.contractEnd || Math.ceil((new Date(account.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 90) && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Tudo em dia por aqui!</p>
                                <p className="text-xs mt-1">Continue monitorando a conta regularmente.</p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ACTIVITIES TAB */}
                <TabsContent value="activities" className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setIsAddActivityOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Nova Atividade
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {accountActivities.map((activity) => (
                      <div id={activity.id} key={activity.id} className="scroll-mt-24 transition-all duration-500 rounded-lg">
                        <ActivityCard
                          activity={activity}
                          assigneeName={getCSM(activity.assignee)?.name}
                          accountName={account.name}
                          teamName={getTeam(activity.team)?.name}
                          onStatusChange={updateActivityStatus}
                          onDelete={deleteActivity}
                        />
                      </div>
                    ))}
                    {accountActivities.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Nenhuma atividade registrada.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {accountTasks.map((task) => (
                      <div id={task.id} key={task.id} className="scroll-mt-24 transition-all duration-500 rounded-lg">
                        <TaskCard
                          task={task}
                          assigneeName={getCSM(task.assignee)?.name}
                          accountName={account.name}
                          onStatusChange={updateTaskStatus}
                          onDelete={deleteTask}
                          isOverdue={task.status !== "completed" && new Date(task.dueDate) < new Date()}
                        />
                      </div>
                    ))}
                    {accountTasks.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Nenhuma tarefa registrada.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ONBOARDING TAB */}
                <TabsContent value="onboarding">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Plano de Onboarding</CardTitle>
                          <CardDescription>Acompanhe o progresso de implantação</CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{onboardingStats.percentage}%</span>
                          <p className="text-xs text-muted-foreground">Concluído</p>
                        </div>
                      </div>
                      <Progress value={onboardingStats.percentage} className="h-2 mt-4" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {['setup', 'training', 'integration', 'adoption'].map((category) => {
                        const categoryTasks = template.filter(t => t.category === category);
                        if (categoryTasks.length === 0) return null;

                        const labels: any = {
                          setup: { label: 'Configuração Inicial', icon: '🔧' },
                          training: { label: 'Treinamento', icon: '📚' },
                          integration: { label: 'Integração', icon: '🔗' },
                          adoption: { label: 'Adoção', icon: '🚀' },
                        };

                        return (
                          <div key={category}>
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                              <span>{labels[category].icon}</span> {labels[category].label}
                            </h4>
                            <div className="space-y-2">
                              {categoryTasks.map((task) => {
                                const isComplete = isTaskComplete(accountId, task.id);
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => isComplete ? uncompleteTask(accountId, task.id) : completeTask(accountId, task.id)}
                                    className={`
                                      flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer group
                                      ${isComplete ? 'bg-muted/50 border-transparent' : 'bg-card hover:border-primary/50 hover:shadow-sm'}
                                    `}
                                  >
                                    <div className={`
                                      mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                      ${isComplete ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground group-hover:border-primary'}
                                    `}>
                                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`font-medium ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
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
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* HEALTH SCORE TAB */}
                <TabsContent value="health" className="space-y-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico de Saúde</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <HealthScoreChart accountId={accountId} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Respostas de Avaliação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <QuestionResponsesChart accountId={accountId} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* RIGHT COLUMN - Sidebar (1/3) */}
          <div className="space-y-6">

            {/* Commercial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Dados Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">MRR</span>
                  <span className="font-semibold">R$ {account.mrr?.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Valor Contrato</span>
                  <span className="font-semibold">
                    R$ {calculateContractValue(account.mrr, account.contractStart, account.contractEnd).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Início</span>
                  <span className="font-medium">{formatDate(account.contractStart)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Renovação</span>
                  <span className="font-medium">{formatDate(account.contractEnd)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Detalhes da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">CSM Responsável</span>
                  <div className="flex items-center gap-3 pt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${account.csm}&background=random`} />
                      <AvatarFallback>{account.csm?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{account.csm || "Não atribuído"}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={`font-medium capitalize ${{
                          "Saudável": "bg-green-100 text-green-700 border-green-200",
                          "Atenção": "bg-yellow-100 text-yellow-700 border-yellow-200",
                          "Crítico": "bg-red-100 text-red-700 border-red-200",
                          "Salvamento": "bg-orange-100 text-orange-700 border-orange-200",
                          "Upsell": "bg-blue-100 text-blue-700 border-blue-200",
                          "Churn": "bg-gray-100 text-gray-700 border-gray-200",
                          "Inadimplente": "bg-purple-100 text-purple-700 border-purple-200",
                        }[account.status || ""] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                      >
                        {account.status || "-"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Última avaliação de HS</span>
                    <p className="font-medium mt-1">
                      {healthScoreEvaluation?.evaluationDate
                        ? new Date(healthScoreEvaluation.evaluationDate).toLocaleDateString('pt-BR')
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kickoff Data (If available) */}
            {account.internalKickoff && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Dados de Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vendedor:</span>
                    <span className="ml-2 font-medium">{account.internalKickoff.salesRep}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Origem:</span>
                    <span className="ml-2 font-medium capitalize">{account.internalKickoff.saleOrigin}</span>
                  </div>
                  {account.internalKickoff.championIdentified && (
                    <div>
                      <span className="text-muted-foreground">Champion:</span>
                      <span className="ml-2 font-medium">{account.internalKickoff.championIdentified}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditAccountDialog
        account={account}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

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

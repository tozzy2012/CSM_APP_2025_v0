import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import KanbanBoard from "@/components/KanbanBoard";
import { useAccountsContext } from "@/contexts/AccountsContext";
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  LayoutGrid,
  BarChart3,
  Kanban as KanbanIcon,
  MoreVertical,
  Pencil
} from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditAccountDialog from "@/components/EditAccountDialog";

const Dashboard = () => {
  const { accounts } = useAccountsContext();
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Calcular estatísticas gerais
  const totalAccounts = accounts.length;
  const avgHealthScore = accounts.length > 0
    ? Math.round(accounts.reduce((sum, acc) => sum + (acc.healthScore || 0), 0) / accounts.length)
    : 0;
  const totalMRR = accounts.reduce((sum, acc) => sum + (acc.mrr || 0), 0);
  const accountsAtRisk = accounts.filter(acc =>
    (acc.healthScore || 0) < 50 || acc.status === 'Crítico' || acc.status === 'Salvamento'
  ).length;

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Saudável": "bg-green-100 text-green-700 border-green-200",
      "Atenção": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Crítico": "bg-red-100 text-red-700 border-red-200",
      "Salvamento": "bg-orange-100 text-orange-700 border-orange-200",
      "Upsell": "bg-blue-100 text-blue-700 border-blue-200",
      "Churn": "bg-gray-100 text-gray-700 border-gray-200",
      "Inadimplente": "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral das suas contas e pipeline
        </p>
      </div>

      {/* Tabs - Redesigned with prominent navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        {/* Custom Tab Navigation */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <TabsList className="grid w-full grid-cols-3 gap-4 bg-transparent h-auto p-0">
              <TabsTrigger
                value="overview"
                className="relative flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 data-[state=active]:shadow-lg group"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 group-data-[state=active]:from-blue-500 group-data-[state=active]:to-blue-600 transition-all">
                  <LayoutGrid className="w-7 h-7 text-blue-600 group-data-[state=active]:text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 group-data-[state=active]:text-blue-700">
                    Visão Geral
                  </div>
                  <div className="text-xs text-gray-500 mt-1 group-data-[state=active]:text-blue-600">
                    Contas e pipeline
                  </div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="kanban"
                className="relative flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-200 data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50 data-[state=active]:shadow-lg group"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 group-data-[state=active]:from-purple-500 group-data-[state=active]:to-purple-600 transition-all">
                  <KanbanIcon className="w-7 h-7 text-purple-600 group-data-[state=active]:text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 group-data-[state=active]:text-purple-700">
                    Kanban Board
                  </div>
                  <div className="text-xs text-gray-500 mt-1 group-data-[state=active]:text-purple-600">
                    Gestão visual
                  </div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="executive"
                className="relative flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all duration-200 data-[state=active]:border-green-500 data-[state=active]:bg-green-50 data-[state=active]:shadow-lg group"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 group-data-[state=active]:from-green-500 group-data-[state=active]:to-green-600 transition-all">
                  <BarChart3 className="w-7 h-7 text-green-600 group-data-[state=active]:text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 group-data-[state=active]:text-green-700">
                    Dashboard Executivo
                  </div>
                  <div className="text-xs text-gray-500 mt-1 group-data-[state=active]:text-green-600">
                    Métricas estratégicas
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAccounts}</div>
                <p className="text-xs text-muted-foreground">
                  Contas ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Score Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgHealthScore}</div>
                <p className="text-xs text-muted-foreground">
                  {avgHealthScore >= 70 ? '🟢 Saudável' : avgHealthScore >= 50 ? '🟡 Atenção' : '🔴 Crítico'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(totalMRR / 1000).toFixed(1)}K
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita recorrente mensal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accounts em Risco</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{accountsAtRisk}</div>
                <p className="text-xs text-red-600">
                  Requer atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Accounts em Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Accounts</CardTitle>
              <CardDescription>
                Arraste e solte para mudar o status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {accounts.map((account) => (
                  <Card key={account.id} className="group hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-blue-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header com nome e menu */}
                        <div className="flex items-start justify-between">
                          <Link href={`/accounts/${account.id}`}>
                            <a className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {account.name}
                              </h4>
                            </a>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* CSM com Avatar */}
                        {account.csm && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {getInitials(account.csm)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600">{account.csm}</span>
                          </div>
                        )}

                        {/* MRR */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-semibold text-sm text-green-600">
                              R$ {account.mrr.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">MRR</span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {account.type && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0 h-5 bg-gray-50 text-gray-700 border-gray-200"
                            >
                              {account.type}
                            </Badge>
                          )}
                          {account.status && (
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-0 h-5 border ${getStatusColor(
                                account.status
                              )}`}
                            >
                              {account.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {accounts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum account cadastrado ainda
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kanban Board */}
        <TabsContent value="kanban">
          <KanbanBoard />
        </TabsContent>

        {/* Dashboard Executivo */}
        <TabsContent value="executive">
          <ExecutiveDashboard />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          isOpen={!!editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

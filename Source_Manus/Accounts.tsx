import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountsContext } from "@/contexts/AccountsContext";
import { useClientsContext } from "@/contexts/ClientsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditAccountDialog from "@/components/EditAccountDialog";
import ImportAccountsDialog from "@/components/ImportAccountsDialog";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Search,
  Plus,
  Pencil,
  ExternalLink,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { accounts, createAccount, deleteAccount } = useAccountsContext();
  const { clients } = useClientsContext();
  const { csms } = useTeamContext();
  const { statuses } = useAccountStatus();
  const { getProgressStats } = useOnboarding();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState<any>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    stage: "onboarding",
    type: "SMB",
    status: "Saudável",
    healthStatus: "healthy" as "healthy" | "at-risk" | "critical",
    healthScore: 75,
    mrr: 0,
    contractValue: 0,
    contractStart: "",
    contractEnd: "",
    csm: "",
    employees: 0,
    website: "",
  });

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStage =
      stageFilter === "all" || account.stage === stageFilter;
    const matchesHealth =
      healthFilter === "all" || account.healthStatus === healthFilter;

    return matchesSearch && matchesStage && matchesHealth;
  });

  // Filtrar clientes para o dropdown
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.cnpj.includes(clientSearchTerm) ||
    (client.legalName && client.legalName.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  // Auto-preencher dados ao selecionar cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        name: client.name,
        industry: client.industry || "",
        website: client.website || "",
        employees: 0, // Não temos esse campo em Client
      });
    }
  };

  const handleCreateAccount = () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!formData.contractStart || !formData.contractEnd) {
      toast.error("Datas de contrato são obrigatórias");
      return;
    }

    createAccount({
      organizationId: currentUser?.organizationId || "",
      clientId: selectedClientId,
      ...formData,
    });
    toast.success("Account criado com sucesso!");
    setIsCreateOpen(false);

    // Reset form
    setSelectedClientId("");
    setClientSearchTerm("");
    setFormData({
      name: "",
      industry: "",
      stage: "onboarding",
      type: "SMB",
      status: "Saudável",
      healthStatus: "healthy",
      healthScore: 75,
      mrr: 0,
      contractValue: 0,
      contractStart: "",
      contractEnd: "",
      csm: "",
      employees: 0,
      website: "",
    });
  };

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "at-risk":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas e clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar Accounts
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Account
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estágios</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="expansion">Expansão</SelectItem>
              <SelectItem value="renewal">Renovação</SelectItem>
              <SelectItem value="at-risk">Em risco</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Saúde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="healthy">Saudável</SelectItem>
              <SelectItem value="at-risk">Em risco</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRR Total</p>
                <p className="text-2xl font-bold">
                  R$ {accounts.reduce((sum, acc) => sum + acc.mrr, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Score Médio</p>
                <p className="text-2xl font-bold">
                  {accounts.length > 0
                    ? Math.round(
                        accounts.reduce((sum, acc) => sum + acc.healthScore, 0) /
                          accounts.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Accounts List */}
        {filteredAccounts.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhum account encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {accounts.length === 0
                ? "Comece criando seu primeiro account vinculado a um cliente"
                : "Tente ajustar os filtros de busca"}
            </p>
            {accounts.length === 0 && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Account
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <Card
                key={account.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative group"
              >
                <div onClick={() => setLocation(`/accounts/${account.id}`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">{account.industry}</p>
                    </div>
                    <Badge className={getHealthBadgeColor(account.healthStatus)}>
                      {account.healthStatus === "healthy" && "Saudável"}
                      {account.healthStatus === "at-risk" && "Em Risco"}
                      {account.healthStatus === "critical" && "Crítico"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">MRR</span>
                      <span className="font-semibold text-green-600">
                        R$ {account.mrr.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className="font-semibold">{account.healthScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">CSM</span>
                      <span className="font-medium">{account.csm || "Não atribuído"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{account.type}</Badge>
                    <Badge variant="secondary">{account.stage}</Badge>
                    {(() => {
                      const stats = getProgressStats(account.id);
                      return (
                        <Badge 
                          variant={stats.isComplete ? "default" : "outline"}
                          className={stats.isComplete ? "bg-green-600" : ""}
                        >
                          {stats.completed}/{stats.total} ✓
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(account);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingAccount(account);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Account Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Novo Account</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Seleção de Cliente */}
              <div className="space-y-2">
                <Label>
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedClientId} onValueChange={handleClientSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Buscar cliente..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {filteredClients.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhum cliente encontrado
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {client.cnpj} • {client.industry || "Sem setor"}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setLocation("/clients");
                    }}
                    title="Criar novo cliente"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedClientId && (
                  <p className="text-sm text-muted-foreground">
                    Cliente selecionado: {clients.find((c) => c.id === selectedClientId)?.name}
                  </p>
                )}
              </div>

              {/* Informações do Account */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled
                    placeholder="Auto-preenchido do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Setor</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    disabled
                    placeholder="Auto-preenchido do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Conta</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="Strategic">Strategic</SelectItem>
                      <SelectItem value="SMB">SMB</SelectItem>
                      <SelectItem value="Startup">Startup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Estágio</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) =>
                      setFormData({ ...formData, stage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="expansion">Expansão</SelectItem>
                      <SelectItem value="renewal">Renovação</SelectItem>
                      <SelectItem value="at-risk">Em risco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status do Pipeline</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csm">CSM Responsável</Label>
                  <Select
                    value={formData.csm}
                    onValueChange={(value) =>
                      setFormData({ ...formData, csm: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um CSM" />
                    </SelectTrigger>
                    <SelectContent>
                      {csms.map((csm) => (
                        <SelectItem key={csm.id} value={csm.name}>
                          {csm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mrr">MRR (R$)</Label>
                  <Input
                    id="mrr"
                    type="number"
                    value={formData.mrr}
                    onChange={(e) =>
                      setFormData({ ...formData, mrr: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractStart">
                    Início do Contrato <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) =>
                      setFormData({ ...formData, contractStart: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEnd">
                    Fim do Contrato <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, contractEnd: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="healthScore">Health Score</Label>
                  <Input
                    id="healthScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        healthScore: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employees">Número de Funcionários</Label>
                  <Input
                    id="employees"
                    type="number"
                    value={formData.employees}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employees: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAccount}>Criar Account</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        {editingAccount && (
          <EditAccountDialog
            account={editingAccount}
            isOpen={!!editingAccount}
            onClose={() => setEditingAccount(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o account <strong>{deletingAccount?.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingAccount(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteAccount(deletingAccount.id);
                  toast.success('Account excluído com sucesso');
                  setDeletingAccount(null);
                }}
              >
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Accounts Dialog */}
        <ImportAccountsDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={(importedAccounts) => {
            importedAccounts.forEach((account) => {
              createAccount(account as any);
            });
            toast.success(`${importedAccounts.length} account(s) importado(s) com sucesso!`);
          }}
        />
      </div>
    </div>
  );
}

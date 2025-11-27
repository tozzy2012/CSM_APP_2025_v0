import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountsContext, Account } from "@/contexts/AccountsContext";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    type: "SMB",
    healthStatus: "healthy" as "healthy" | "at-risk" | "critical",
    mrr: 0,
    contractStart: "",
    contractEnd: "",
    csm: "",
    website: "",
  });

  // Internal kickoff state
  const [kickoffData, setKickoffData] = useState({
    salesRep: "",
    saleOrigin: "",
    saleOriginOther: "",
    negotiatedWith: "",
    customerSituation: "",
    existingTools: "",
    painPoints: "",
    previousAttempts: "",
    expectedOutcomes: "",
    successCriteria: "",
    businessImpact: "",
    criticalDeadline: "",
    urgencyReason: "",
    whyChoseUs: "",
    competitorsConsidered: "",
    decisionCriteria: "",
    negotiationDetails: "",
    promisesMade: "",
    redFlags: "",
    championIdentified: "",
    communicationPreferences: "",
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

  const handleCreateAccount = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!formData.contractStart || !formData.contractEnd) {
      toast.error("Datas de contrato são obrigatórias");
      return;
    }

    try {
      await createAccount({
        organizationId: currentUser?.organizationId || "",
        clientId: selectedClientId,
        ...formData,
        internalKickoff: kickoffData,
      });
      toast.success("Account criado com sucesso!");
      setIsCreateOpen(false);

      // Reset form
      setSelectedClientId("");
      setClientSearchTerm("");
      setActiveTab("basic");
      setFormData({
        name: "",
        industry: "",
        type: "SMB",
        healthStatus: "healthy",
        mrr: 0,
        contractStart: "",
        contractEnd: "",
        csm: "",
        website: "",
      });
      setKickoffData({
        salesRep: "",
        saleOrigin: "",
        saleOriginOther: "",
        negotiatedWith: "",
        customerSituation: "",
        existingTools: "",
        painPoints: "",
        previousAttempts: "",
        expectedOutcomes: "",
        successCriteria: "",
        businessImpact: "",
        criticalDeadline: "",
        urgencyReason: "",
        whyChoseUs: "",
        competitorsConsidered: "",
        decisionCriteria: "",
        negotiationDetails: "",
        promisesMade: "",
        redFlags: "",
        championIdentified: "",
        communicationPreferences: "",
      });
    } catch (error) {
      console.error("Erro ao criar account:", error);
      toast.error("Erro ao criar account");
    }
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

                  {/* Badges e botões na mesma linha - parte inferior */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Badges à esquerda */}
                    <div className="flex items-center gap-2 flex-wrap flex-1">
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

                    {/* Action Buttons à direita - sempre visíveis no hover do card */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Account Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="w-[90vw] max-w-[1800px] max-h-[95vh] overflow-y-auto p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl">Novo Account</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="kickoff">Kick Off Interno</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                <TabsContent value="basic" className="space-y-6">
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

                  {/* Informações Básicas do Account */}
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
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        placeholder="https://..."
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
                  </div>
                </TabsContent>

                <TabsContent value="kickoff" className="space-y-6">
                  {/* Vendas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações de Vendas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salesRep">Vendedor</Label>
                        <Input
                          id="salesRep"
                          value={kickoffData.salesRep}
                          onChange={(e) => setKickoffData({ ...kickoffData, salesRep: e.target.value })}
                          placeholder="Nome do vendedor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="saleOrigin">Origem da Venda</Label>
                        <Select
                          value={kickoffData.saleOrigin}
                          onValueChange={(value) => setKickoffData({ ...kickoffData, saleOrigin: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inbound">Inbound</SelectItem>
                            <SelectItem value="outbound">Outbound</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {kickoffData.saleOrigin === "outro" && (
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="saleOriginOther">Qual outra origem?</Label>
                          <Input
                            id="saleOriginOther"
                            value={kickoffData.saleOriginOther}
                            onChange={(e) => setKickoffData({ ...kickoffData, saleOriginOther: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Negociação e Expectativas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Negociação e Expectativas</h3>
                    <div className="space-y-2">
                      <Label htmlFor="negotiatedWith">Com quem o vendedor negociou?</Label>
                      <Textarea
                        id="negotiatedWith"
                        value={kickoffData.negotiatedWith}
                        onChange={(e) => setKickoffData({ ...kickoffData, negotiatedWith: e.target.value })}
                        placeholder="Nomes e cargos..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negotiationDetails">Como foi a negociação?</Label>
                      <Textarea
                        id="negotiationDetails"
                        value={kickoffData.negotiationDetails}
                        onChange={(e) => setKickoffData({ ...kickoffData, negotiationDetails: e.target.value })}
                        placeholder="Detalhes importantes da negociação..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedOutcomes">Qual a expectativa do cliente?</Label>
                      <Textarea
                        id="expectedOutcomes"
                        value={kickoffData.expectedOutcomes}
                        onChange={(e) => setKickoffData({ ...kickoffData, expectedOutcomes: e.target.value })}
                        placeholder="O que eles esperam alcançar..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="successCriteria">O que é sucesso para o cliente?</Label>
                      <Textarea
                        id="successCriteria"
                        value={kickoffData.successCriteria}
                        onChange={(e) => setKickoffData({ ...kickoffData, successCriteria: e.target.value })}
                        placeholder="Critérios de sucesso definidos..."
                      />
                    </div>
                  </div>

                  {/* SPICED */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Framework SPICED</h3>

                    <div className="space-y-2">
                      <Label htmlFor="customerSituation">Situation (Situação)</Label>
                      <Textarea
                        id="customerSituation"
                        value={kickoffData.customerSituation}
                        onChange={(e) => setKickoffData({ ...kickoffData, customerSituation: e.target.value })}
                        placeholder="Fatos e contexto atual do cliente..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="painPoints">Pain (Dor)</Label>
                      <Textarea
                        id="painPoints"
                        value={kickoffData.painPoints}
                        onChange={(e) => setKickoffData({ ...kickoffData, painPoints: e.target.value })}
                        placeholder="Problemas que levaram à compra..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessImpact">Impact (Impacto)</Label>
                      <Textarea
                        id="businessImpact"
                        value={kickoffData.businessImpact}
                        onChange={(e) => setKickoffData({ ...kickoffData, businessImpact: e.target.value })}
                        placeholder="Impacto financeiro ou operacional..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="criticalDeadline">Critical Event (Data Crítica)</Label>
                        <Input
                          id="criticalDeadline"
                          value={kickoffData.criticalDeadline}
                          onChange={(e) => setKickoffData({ ...kickoffData, criticalDeadline: e.target.value })}
                          placeholder="Ex: Lançamento em 30 dias"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgencyReason">Motivo da Urgência</Label>
                        <Input
                          id="urgencyReason"
                          value={kickoffData.urgencyReason}
                          onChange={(e) => setKickoffData({ ...kickoffData, urgencyReason: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="decisionCriteria">Decision (Decisão)</Label>
                      <Textarea
                        id="decisionCriteria"
                        value={kickoffData.decisionCriteria}
                        onChange={(e) => setKickoffData({ ...kickoffData, decisionCriteria: e.target.value })}
                        placeholder="Como e por que decidiram por nós..."
                      />
                    </div>
                  </div>

                  {/* Outros */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Outras Informações</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="championIdentified">Champion Identificado</Label>
                        <Input
                          id="championIdentified"
                          value={kickoffData.championIdentified}
                          onChange={(e) => setKickoffData({ ...kickoffData, championIdentified: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="communicationPreferences">Preferência de Comunicação</Label>
                        <Input
                          id="communicationPreferences"
                          value={kickoffData.communicationPreferences}
                          onChange={(e) => setKickoffData({ ...kickoffData, communicationPreferences: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promisesMade">Promessas Feitas</Label>
                      <Textarea
                        id="promisesMade"
                        value={kickoffData.promisesMade}
                        onChange={(e) => setKickoffData({ ...kickoffData, promisesMade: e.target.value })}
                        placeholder="Alguma promessa específica feita pelo vendedor?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="redFlags">Red Flags (Riscos)</Label>
                      <Textarea
                        id="redFlags"
                        value={kickoffData.redFlags}
                        onChange={(e) => setKickoffData({ ...kickoffData, redFlags: e.target.value })}
                        className="border-red-200 focus-visible:ring-red-500"
                        placeholder="Algum ponto de atenção ou risco identificado?"
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

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
                onClick={async () => {
                  try {
                    if (deletingAccount) {
                      await deleteAccount(deletingAccount.id);
                      toast.success('Account excluído com sucesso');
                      setDeletingAccount(null);
                    }
                  } catch (error) {
                    console.error("Erro ao excluir account:", error);
                    toast.error("Erro ao excluir account");
                  }
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

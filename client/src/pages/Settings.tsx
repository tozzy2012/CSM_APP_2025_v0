/**
 * Settings Page - Configurações da plataforma
 * Layout reorganizado com navegação lateral
 */
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Bell,
  Zap,
  Palette,
  Users,
  Tag,
  Kanban,
  ListChecks,
  Heart,
  Building2,
  Activity,
  CheckSquare,
} from "lucide-react";
import TeamManagement from "@/components/TeamManagement";
import TagsManagement from "@/components/TagsManagement";
import StatusManagement from "@/components/StatusManagement";
import HealthScoreSettings from "@/components/HealthScoreSettings";
import OnboardingSettings from "@/components/OnboardingSettings";
import AISettings from "@/components/AISettings";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizations } from "@/hooks/useOrganizations";

type SettingsSection =
  | "general"
  | "pipeline"
  | "operations"
  | "onboarding"
  | "healthscore"
  | "team"
  | "tags"
  | "notifications"
  | "integrations"
  | "ai";

export default function Settings() {
  const { currentOrganization } = useAuth();
  const { updateOrganization } = useOrganizations();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  // General Settings
  const [companyName, setCompanyName] = useState(() => {
    return currentOrganization?.name || "Zapper CS Platform";
  });

  // Atualizar companyName quando organização mudar
  useEffect(() => {
    if (currentOrganization?.name) {
      setCompanyName(currentOrganization.name);
    }
  }, [currentOrganization]);
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem("settings_timezone") || "America/Sao_Paulo";
  });

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [healthScoreAlerts, setHealthScoreAlerts] = useState(true);
  const [playbookAlerts, setPlaybookAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Integrations
  const [googleConnected, setGoogleConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [salesforceConnected, setSalesforceConnected] = useState(false);

  const handleSaveGeneral = () => {
    if (!currentOrganization) {
      toast.error("Organização não encontrada");
      return;
    }

    // Atualizar nome da organização
    updateOrganization(currentOrganization.id, { name: companyName });

    // Salvar timezone no localStorage (configuração global do usuário)
    localStorage.setItem("settings_timezone", timezone);

    toast.success("Configurações gerais salvas com sucesso!");
  };

  const handleSaveNotifications = () => {
    toast.success("Configurações de notificações salvas!");
  };

  const handleConnectIntegration = (integration: string) => {
    toast.success(`Conectando ${integration}...`);
    setTimeout(() => {
      if (integration === "Google") setGoogleConnected(true);
      if (integration === "Slack") setSlackConnected(true);
      if (integration === "Salesforce") setSalesforceConnected(true);
      toast.success(`${integration} conectado com sucesso!`);
    }, 1000);
  };

  const handleDisconnectIntegration = (integration: string) => {
    if (integration === "Google") setGoogleConnected(false);
    if (integration === "Slack") setSlackConnected(false);
    if (integration === "Salesforce") setSalesforceConnected(false);
    toast.success(`${integration} desconectado!`);
  };

  // Menu de navegação lateral
  const navigationItems = [
    {
      id: "general" as SettingsSection,
      label: "Geral",
      icon: SettingsIcon,
      description: "Nome, logo e configurações básicas",
    },
    {
      id: "pipeline" as SettingsSection,
      label: "Pipeline",
      icon: Kanban,
      description: "Status do Kanban e tipos de account",
    },
    {
      id: "operations" as SettingsSection,
      label: "Operações",
      icon: Activity,
      description: "Activities, tasks e prioridades",
    },
    {
      id: "onboarding" as SettingsSection,
      label: "Onboarding",
      icon: ListChecks,
      description: "Template e categorias de onboarding",
    },
    {
      id: "healthscore" as SettingsSection,
      label: "Health Score",
      icon: Heart,
      description: "Perguntas, pesos e perfis",
    },
    {
      id: "team" as SettingsSection,
      label: "Equipe",
      icon: Users,
      description: "CSMs e times",
    },
    {
      id: "tags" as SettingsSection,
      label: "Tags",
      icon: Tag,
      description: "Gerenciamento de tags",
    },
    {
      id: "notifications" as SettingsSection,
      label: "Notificações",
      icon: Bell,
      description: "Alertas e relatórios",
    },
    {
      id: "integrations" as SettingsSection,
      label: "Integrações",
      icon: Zap,
      description: "Conectar serviços externos",
    },
    {
      id: "ai" as SettingsSection,
      label: "Inteligência Artificial",
      icon: Zap, // Using Zap for now, or could import Bot
      description: "Configurar OpenAI e Prompts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Personalize a plataforma de acordo com suas necessidades
        </p>
      </div>

      {/* Layout com Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar de Navegação */}
        <aside className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p
                        className={`text-xs mt-0.5 ${isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                          }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          {/* Geral */}
          {activeSection === "general" && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Configurações Gerais</h2>
                  <p className="text-muted-foreground mt-1">
                    Configure o nome, logo e informações básicas da plataforma
                  </p>
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Nome da Plataforma</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome da sua empresa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome aparecerá no cabeçalho e em toda a plataforma
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="logo">Logo da Plataforma</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <Button variant="outline">Upload Logo</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recomendado: PNG ou SVG, tamanho máximo 2MB
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">
                          São Paulo (GMT-3)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          Nova York (GMT-5)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Londres (GMT+0)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Tema Padrão</Label>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1">
                        <Palette className="w-4 h-4 mr-2" />
                        Claro
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Palette className="w-4 h-4 mr-2" />
                        Escuro
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral}>Salvar Alterações</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Pipeline */}
          {activeSection === "pipeline" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">Configurações de Pipeline</h2>
                    <p className="text-muted-foreground mt-1">
                      Personalize os status do Kanban e tipos de account
                    </p>
                  </div>
                  <Separator />
                </div>
              </Card>

              {/* Status do Kanban */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Kanban className="w-5 h-5" />
                      Status do Kanban
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure as colunas do quadro Kanban. Mudanças aqui afetam
                      toda a plataforma.
                    </p>
                  </div>
                  <Separator />
                  <StatusManagement />
                </div>
              </Card>

              {/* Tipos de Account */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Tipos de Account
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Defina os tipos de clientes (Enterprise, SMB, etc.)
                    </p>
                  </div>
                  <Separator />
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Funcionalidade em desenvolvimento</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Operações */}
          {activeSection === "operations" && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Configurações Operacionais</h2>
                  <p className="text-muted-foreground mt-1">
                    Personalize tipos de activities e prioridades de tasks
                  </p>
                </div>
                <Separator />
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </Card>
          )}

          {/* Onboarding */}
          {activeSection === "onboarding" && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Configurações de Onboarding</h2>
                  <p className="text-muted-foreground mt-1">
                    Personalize o template e categorias de onboarding
                  </p>
                </div>
                <Separator />
                <OnboardingSettings />
              </div>
            </Card>
          )}

          {/* Health Score */}
          {activeSection === "healthscore" && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Configurações de Health Score</h2>
                  <p className="text-muted-foreground mt-1">
                    Configure perguntas, pesos e perfis de avaliação
                  </p>
                </div>
                <Separator />
                <HealthScoreSettings />
              </div>
            </Card>
          )}

          {/* Equipe */}
          {activeSection === "team" && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Gerenciamento de Equipe</h2>
                  <p className="text-muted-foreground mt-1">
                    Gerencie CSMs e times da sua organização
                  </p>
                </div>
                <Separator />
                <TeamManagement />
              </div>
            </Card>
          )}

          {/* Tags */}
          {activeSection === "tags" && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Gerenciamento de Tags</h2>
                  <p className="text-muted-foreground mt-1">
                    Crie e organize tags para categorizar conteúdo
                  </p>
                </div>
                <Separator />
                <TagsManagement />
              </div>
            </Card>
          )}

          {/* Notificações */}
          {activeSection === "notifications" && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Configurações de Notificações</h2>
                  <p className="text-muted-foreground mt-1">
                    Gerencie alertas e relatórios automáticos
                  </p>
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações importantes por email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Health Score</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando um account entrar em risco
                      </p>
                    </div>
                    <Switch
                      checked={healthScoreAlerts}
                      onCheckedChange={setHealthScoreAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Playbooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre execuções de playbooks
                      </p>
                    </div>
                    <Switch
                      checked={playbookAlerts}
                      onCheckedChange={setPlaybookAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Relatórios Semanais</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba um resumo semanal das métricas
                      </p>
                    </div>
                    <Switch
                      checked={weeklyReports}
                      onCheckedChange={setWeeklyReports}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Integrações */}
          {activeSection === "integrations" && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Integrações</h2>
                  <p className="text-muted-foreground mt-1">
                    Conecte a plataforma com serviços externos
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  {/* Google */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">G</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Google Workspace</h3>
                          <p className="text-sm text-muted-foreground">
                            Sincronize calendário e emails
                          </p>
                        </div>
                      </div>
                      {googleConnected ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnectIntegration("Google")}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnectIntegration("Google")}
                        >
                          Conectar
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Slack */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">#</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Slack</h3>
                          <p className="text-sm text-muted-foreground">
                            Receba notificações no Slack
                          </p>
                        </div>
                      </div>
                      {slackConnected ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnectIntegration("Slack")}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button onClick={() => handleConnectIntegration("Slack")}>
                          Conectar
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Salesforce */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">☁</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Salesforce</h3>
                          <p className="text-sm text-muted-foreground">
                            Sincronize dados de CRM
                          </p>
                        </div>
                      </div>
                      {salesforceConnected ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDisconnectIntegration("Salesforce")
                          }
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnectIntegration("Salesforce")}
                        >
                          Conectar
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          )}

          {/* AI Settings */}
          {activeSection === "ai" && <AISettings />}
        </div>
      </div>
    </div>
  );
}

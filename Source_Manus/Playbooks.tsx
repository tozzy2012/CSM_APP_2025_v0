/**
 * Playbooks Page - Automação e workflows
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Play, Edit, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

interface Playbook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: "active" | "inactive";
  executionCount: number;
  steps: PlaybookStep[];
}

interface PlaybookStep {
  id: string;
  type: "email" | "task" | "webhook" | "wait";
  description: string;
  config: any;
}

export default function Playbooks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Mock data
  const [playbooks, setPlaybooks] = useState<Playbook[]>([
    {
      id: "1",
      name: "Onboarding Sequence",
      description: "Automated onboarding flow for new customers",
      trigger: "account_created",
      status: "active",
      executionCount: 24,
      steps: [
        {
          id: "1",
          type: "email",
          description: "Send welcome email",
          config: { template: "welcome" },
        },
        {
          id: "2",
          type: "task",
          description: "Create onboarding call task",
          config: { assignee: "csm" },
        },
        {
          id: "3",
          type: "wait",
          description: "Wait 2 days",
          config: { duration: 2 },
        },
        {
          id: "4",
          type: "email",
          description: "Send getting started guide",
          config: { template: "getting_started" },
        },
      ],
    },
    {
      id: "2",
      name: "At-Risk Alert",
      description: "Notify CSM when health score drops",
      trigger: "health_score_low",
      status: "active",
      executionCount: 8,
      steps: [
        {
          id: "1",
          type: "task",
          description: "Create urgent follow-up task",
          config: { priority: "high" },
        },
        {
          id: "2",
          type: "email",
          description: "Notify CSM",
          config: { template: "at_risk_alert" },
        },
      ],
    },
    {
      id: "3",
      name: "Renewal Reminder",
      description: "Automated renewal process 60 days before",
      trigger: "renewal_approaching",
      status: "active",
      executionCount: 12,
      steps: [
        {
          id: "1",
          type: "task",
          description: "Schedule renewal call",
          config: { daysBeforeRenewal: 60 },
        },
        {
          id: "2",
          type: "email",
          description: "Send renewal options",
          config: { template: "renewal_options" },
        },
        {
          id: "3",
          type: "wait",
          description: "Wait 30 days",
          config: { duration: 30 },
        },
        {
          id: "4",
          type: "task",
          description: "Final renewal follow-up",
          config: { priority: "high" },
        },
      ],
    },
    {
      id: "4",
      name: "Upsell Opportunity",
      description: "Detect and act on expansion opportunities",
      trigger: "usage_threshold",
      status: "inactive",
      executionCount: 5,
      steps: [
        {
          id: "1",
          type: "task",
          description: "Create upsell task",
          config: { assignee: "csm" },
        },
        {
          id: "2",
          type: "webhook",
          description: "Notify sales team",
          config: { url: "/api/sales/notify" },
        },
      ],
    },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "account_created",
  });

  // Criar playbook
  const handleCreatePlaybook = () => {
    if (!formData.name) {
      toast.error("Nome do playbook é obrigatório");
      return;
    }

    const newPlaybook: Playbook = {
      id: String(playbooks.length + 1),
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      status: "active",
      executionCount: 0,
      steps: [],
    };

    setPlaybooks([...playbooks, newPlaybook]);
    setIsCreateOpen(false);
    setFormData({
      name: "",
      description: "",
      trigger: "account_created",
    });
    toast.success("Playbook criado com sucesso!");
  };

  // Executar playbook manualmente
  const handleExecutePlaybook = (id: string) => {
    toast.success("Playbook executado com sucesso!");
    // Atualizar contador
    setPlaybooks(
      playbooks.map((p) =>
        p.id === id ? { ...p, executionCount: p.executionCount + 1 } : p
      )
    );
  };

  // Toggle status
  const handleToggleStatus = (id: string) => {
    setPlaybooks(
      playbooks.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p
      )
    );
    toast.success("Status atualizado!");
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "email":
        return "📧";
      case "task":
        return "✓";
      case "webhook":
        return "🔗";
      case "wait":
        return "⏰";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playbooks</h1>
          <p className="text-muted-foreground mt-1">
            Automação e workflows inteligentes
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Playbook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Playbook</DialogTitle>
              <DialogDescription>
                Configure um novo workflow automatizado
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Playbook *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Onboarding Sequence"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o objetivo deste playbook..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trigger">Gatilho</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trigger: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_created">
                      Account Criada
                    </SelectItem>
                    <SelectItem value="health_score_low">
                      Health Score Baixo
                    </SelectItem>
                    <SelectItem value="renewal_approaching">
                      Renovação Próxima
                    </SelectItem>
                    <SelectItem value="usage_threshold">
                      Limite de Uso
                    </SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreatePlaybook}>Criar Playbook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Playbooks</p>
          <p className="text-3xl font-bold mt-2">{playbooks.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Ativos</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {playbooks.filter((p) => p.status === "active").length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Inativos</p>
          <p className="text-3xl font-bold mt-2 text-gray-600">
            {playbooks.filter((p) => p.status === "inactive").length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Execuções</p>
          <p className="text-3xl font-bold mt-2">
            {playbooks.reduce((sum, p) => sum + p.executionCount, 0)}
          </p>
        </Card>
      </div>

      {/* Playbooks List */}
      <div className="grid grid-cols-1 gap-4">
        {playbooks.map((playbook) => (
          <Card key={playbook.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{playbook.name}</h3>
                    <Badge
                      variant={
                        playbook.status === "active" ? "default" : "secondary"
                      }
                    >
                      {playbook.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {playbook.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Gatilho: {playbook.trigger}</span>
                    <span>•</span>
                    <span>{playbook.steps.length} steps</span>
                    <span>•</span>
                    <span>{playbook.executionCount} execuções</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecutePlaybook(playbook.id)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Executar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(playbook.id)}
                >
                  {playbook.status === "active" ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Steps */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3">Steps do Workflow:</h4>
              <div className="space-y-2">
                {playbook.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 text-sm p-2 rounded bg-accent/50"
                  >
                    <span className="text-lg">{getStepIcon(step.type)}</span>
                    <span className="font-medium">Step {index + 1}:</span>
                    <span className="text-muted-foreground">
                      {step.description}
                    </span>
                    <Badge variant="outline" className="ml-auto capitalize">
                      {step.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

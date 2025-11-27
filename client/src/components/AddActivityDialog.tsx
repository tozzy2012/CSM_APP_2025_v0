/**
 * Add Activity Dialog Component
 * Formulário para criar nova atividade
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useActivitiesContext } from "@/contexts/ActivitiesContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAccountsContext } from "@/contexts/AccountsContext";

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
}

export default function AddActivityDialog({
  open,
  onOpenChange,
  accountId,
}: AddActivityDialogProps) {
  const { currentUser } = useAuth();
  const { createActivity } = useActivitiesContext();
  const { csms, teams } = useTeamContext();
  const { accounts } = useAccountsContext();

  const [formData, setFormData] = useState({
    type: "note" as "note" | "call" | "email" | "meeting" | "system",
    title: "",
    description: "",
    assignee: csms[0]?.id || "",
    team: teams[0]?.id || "",
    status: "pending" as "pending" | "in-progress" | "completed" | "cancelled",
    dueDate: "",
    accountId: accountId || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.MouseEvent) => {
    console.log("[AddActivityDialog] handleSubmit chamado", { formData });

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setLoading(true);
      console.log("[AddActivityDialog] Loading set to true");

      if (!formData.title) {
        console.log("[AddActivityDialog] Validation failed: title missing");
        toast.error("Título é obrigatório");
        setLoading(false);
        return;
      }

      if (!formData.dueDate) {
        console.log("[AddActivityDialog] Validation failed: dueDate missing");
        toast.error("Data de vencimento é obrigatória");
        setLoading(false);
        return;
      }

      if (!formData.accountId) {
        console.log("[AddActivityDialog] Validation failed: accountId missing");
        toast.error("Cliente é obrigatório");
        setLoading(false);
        return;
      }

      console.log("[AddActivityDialog] Validation passed, calling createActivity");
      await createActivity({
        ...formData,
        accountId: formData.accountId,
        createdBy: formData.assignee,
      });

      console.log("[AddActivityDialog] Activity created successfully");
      toast.success("Atividade criada com sucesso!");
      onOpenChange(false);

      // Reset form
      setFormData({
        type: "note",
        title: "",
        description: "",
        assignee: csms[0]?.id || "",
        team: teams[0]?.id || "",
        status: "pending",
        dueDate: "",
        accountId: accountId || "",
      });
    } catch (error) {
      console.error("[AddActivityDialog] Erro ao criar atividade:", error);
      toast.error("Erro ao criar atividade. Tente novamente.");
    } finally {
      console.log("[AddActivityDialog] Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
          <DialogDescription>
            Crie uma nova atividade para este cliente
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="call">Ligação</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in-progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Cliente *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) =>
                setFormData({ ...formData, accountId: value })
              }
              disabled={!!accountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum cliente cadastrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Quarterly Business Review"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva os detalhes da atividade..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Responsável *</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um CSM" />
                </SelectTrigger>
                <SelectContent>
                  {csms.length > 0 ? (
                    csms.map((csm) => (
                      <SelectItem key={csm.id} value={csm.id}>
                        {csm.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum CSM cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Time *</Label>
              <Select
                value={formData.team}
                onValueChange={(value) =>
                  setFormData({ ...formData, team: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum Time cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Atividade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

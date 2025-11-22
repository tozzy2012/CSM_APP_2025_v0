/**
 * Add Task Dialog Component
 * Formulário para criar nova task
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
import { useTasksContext } from "@/contexts/TasksContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAccountsContext } from "@/contexts/AccountsContext";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
}

export default function AddTaskDialog({
  open,
  onOpenChange,
  accountId,
}: AddTaskDialogProps) {
  const { currentUser } = useAuth();
  const { createTask } = useTasksContext();
  const { csms } = useTeamContext();
  const { accounts } = useAccountsContext();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: csms[0]?.id || "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "todo" as "todo" | "in-progress" | "completed" | "cancelled",
    dueDate: "",
    accountId: accountId || "",
  });

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Data de vencimento é obrigatória");
      return;
    }

    if (!formData.accountId) {
      toast.error("Cliente é obrigatório");
      return;
    }

    createTask({
      organizationId: currentUser?.organizationId || "",
      ...formData,
      accountId: formData.accountId,
      createdBy: formData.assignee,
    });

    toast.success("Task criada com sucesso!");
    onOpenChange(false);

    // Reset form
    setFormData({
      title: "",
      description: "",
      assignee: csms[0]?.id || "",
      priority: "medium",
      status: "todo",
      dueDate: "",
      accountId: accountId || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Task</DialogTitle>
          <DialogDescription>
            Crie uma nova tarefa
            {accountId ? " para este cliente" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
              placeholder="Ex: Preparar apresentação QBR"
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
              placeholder="Descreva os detalhes da tarefa..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
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
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in-progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                      Nenhum CSM cadastrado. Cadastre em Settings.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Criar Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

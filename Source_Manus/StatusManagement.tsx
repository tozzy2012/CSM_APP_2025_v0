/**
 * Status Management Component
 * Gerenciamento de status do pipeline de accounts
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, GripVertical, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { useAccountStatus } from "@/hooks/useAccountStatus";

export default function StatusManagement() {
  const { statuses, createStatus, updateStatus, deleteStatus, reorderStatuses } =
    useAccountStatus();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);

  // Form states
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("blue");
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("blue");

  const colorOptions = [
    { value: "green", label: "Verde", class: "bg-green-500" },
    { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
    { value: "red", label: "Vermelho", class: "bg-red-500" },
    { value: "orange", label: "Laranja", class: "bg-orange-500" },
    { value: "blue", label: "Azul", class: "bg-blue-500" },
    { value: "purple", label: "Roxo", class: "bg-purple-500" },
    { value: "gray", label: "Cinza", class: "bg-gray-500" },
  ];

  const handleAddStatus = () => {
    if (!newStatusName.trim()) {
      toast.error("Digite um nome para o status");
      return;
    }

    createStatus({
      name: newStatusName.trim(),
      color: newStatusColor,
      icon: "circle",
      order: statuses.length,
    });

    setNewStatusName("");
    setNewStatusColor("blue");
    setIsAddDialogOpen(false);
    toast.success("Status adicionado com sucesso!");
  };

  const handleEditStatus = () => {
    if (!editStatusName.trim()) {
      toast.error("Digite um nome para o status");
      return;
    }

    if (editingStatus) {
      updateStatus(editingStatus.id, {
        name: editStatusName.trim(),
        color: editStatusColor,
      });

      setEditingStatus(null);
      setEditStatusName("");
      setEditStatusColor("blue");
      setIsEditDialogOpen(false);
      toast.success("Status atualizado com sucesso!");
    }
  };

  const handleDeleteStatus = (statusId: string) => {
    if (confirm("Tem certeza que deseja excluir este status?")) {
      deleteStatus(statusId);
      toast.success("Status excluído com sucesso!");
    }
  };

  const openEditDialog = (status: any) => {
    setEditingStatus(status);
    setEditStatusName(status.name);
    setEditStatusColor(status.color);
    setIsEditDialogOpen(true);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      gray: "bg-gray-500",
    };
    return colors[color] || "bg-gray-500";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Status do Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os status do pipeline de accounts para o Kanban Board
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Status</DialogTitle>
              <DialogDescription>
                Crie um novo status para o pipeline de accounts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="statusName">Nome do Status</Label>
                <Input
                  id="statusName"
                  placeholder="Ex: Onboarding, Ativo, Expansão..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="statusColor">Cor</Label>
                <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded ${color.class}`}
                          ></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <Badge
                  className={`${getColorClass(newStatusColor)} text-white`}
                >
                  {newStatusName || "Nome do Status"}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddStatus}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status List */}
      <div className="space-y-3">
        {statuses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum status configurado ainda.</p>
            <p className="text-sm mt-1">
              Clique em "Adicionar Status" para começar.
            </p>
          </div>
        ) : (
          statuses
            .sort((a, b) => a.order - b.order)
            .map((status, index) => (
              <Card key={status.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getColorClass(
                          status.color
                        )}`}
                      ></div>
                      <div>
                        <p className="font-medium">{status.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordem: {index + 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(status)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStatus(status.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status</DialogTitle>
            <DialogDescription>
              Atualize as informações do status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="editStatusName">Nome do Status</Label>
              <Input
                id="editStatusName"
                value={editStatusName}
                onChange={(e) => setEditStatusName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editStatusColor">Cor</Label>
              <Select value={editStatusColor} onValueChange={setEditStatusColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.class}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <Badge className={`${getColorClass(editStatusColor)} text-white`}>
                {editStatusName || "Nome do Status"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditStatus}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Como usar:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Os status aparecem no Kanban Board do Dashboard</li>
              <li>• Arraste accounts entre colunas para mudar o status</li>
              <li>• A ordem dos status define a ordem das colunas</li>
              <li>• Escolha cores que representem o estado da account</li>
            </ul>
          </div>
        </div>
      </Card>
    </Card>
  );
}

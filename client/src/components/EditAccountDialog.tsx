import { useState, useEffect } from "react";
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
import { useAccountsContext, Account } from "@/contexts/AccountsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { toast } from "sonner";

interface EditAccountDialogProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAccountDialog({
  account,
  isOpen,
  onClose,
}: EditAccountDialogProps) {
  const { updateAccount } = useAccountsContext();
  const { csms } = useTeamContext();
  const { statuses } = useAccountStatus();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    stage: "",
    type: "",
    status: "",
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

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        industry: account.industry || "",
        stage: account.stage || "onboarding",
        type: account.type || "SMB",
        status: account.status || "",
        healthStatus: account.healthStatus || "healthy",
        healthScore: account.healthScore || 75,
        mrr: account.mrr || 0,
        contractValue: account.contractValue || 0,
        contractStart: account.contractStart || "",
        contractEnd: account.contractEnd || "",
        csm: account.csm || "",
        employees: account.employees || 0,
        website: account.website || "",
      });
    }
  }, [account]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateAccount(account.id, formData);
      toast.success("Account atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar account:", error);
      toast.error("Erro ao atualizar account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Account: {account.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
                <SelectValue placeholder="Selecione o status" />
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
            <Label htmlFor="contractStart">Início do Contrato</Label>
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
            <Label htmlFor="contractEnd">Fim do Contrato</Label>
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

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

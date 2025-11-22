/**
 * Edit Account Dialog Component
 * Dialog para editar informações de uma account
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useAccountsContext, Account } from "@/contexts/AccountsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";

interface EditAccountDialogProps {
  account: Account;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function EditAccountDialog({ account, isOpen: externalIsOpen, onClose }: EditAccountDialogProps) {
  const { updateAccount } = useAccountsContext();
  const { csms } = useTeamContext();
  const { statuses } = useAccountStatus();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? (value: boolean) => { if (!value) onClose(); } : setInternalIsOpen;
  
  // Form states
  const [name, setName] = useState(account.name);
  const [industry, setIndustry] = useState(account.industry);
  const [website, setWebsite] = useState(account.website);
  const [employees, setEmployees] = useState(account.employees);
  const [stage, setStage] = useState(account.stage);
  const [accountType, setAccountType] = useState(account.type || "SMB");
  const [pipelineStatus, setPipelineStatus] = useState(account.status || "Saudável");
  const [csm, setCsm] = useState(account.csm);
  const [mrr, setMrr] = useState(account.mrr);
  const [contractValue, setContractValue] = useState(account.contractValue);
  const [contractStart, setContractStart] = useState(account.contractStart);
  const [contractEnd, setContractEnd] = useState(account.contractEnd);
  const [healthScore, setHealthScore] = useState(account.healthScore);
  const [healthStatus, setHealthStatus] = useState<string>(account.healthStatus);

  // Reset form when account changes
  useEffect(() => {
    setName(account.name);
    setIndustry(account.industry);
    setWebsite(account.website);
    setEmployees(account.employees);
    setStage(account.stage);
    setAccountType(account.type || "SMB");
    setPipelineStatus(account.status || "Saudável");
    setCsm(account.csm);
    setMrr(account.mrr);
    setContractValue(account.contractValue);
    setContractStart(account.contractStart);
    setContractEnd(account.contractEnd);
    setHealthScore(account.healthScore);
    setHealthStatus(account.healthStatus);
  }, [account]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    if (!contractStart || !contractEnd) {
      toast.error("Datas de contrato são obrigatórias");
      return;
    }

    updateAccount(account.id, {
      name: name.trim(),
      industry,
      website,
      employees,
      stage,
      type: accountType,
      status: pipelineStatus,
      csm,
      mrr,
      contractValue,
      contractStart,
      contractEnd,
      healthScore,
      healthStatus: healthStatus as "healthy" | "at-risk" | "critical",
    });

    setIsOpen(false);
    toast.success("Account atualizada com sucesso!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Account</DialogTitle>
          <DialogDescription>
            Atualize as informações da account
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Nome da Empresa */}
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              placeholder="Ex: Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Indústria */}
          <div className="grid gap-2">
            <Label htmlFor="industry">Indústria</Label>
            <Input
              id="industry"
              placeholder="Ex: Technology"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          {/* Website */}
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* Número de Funcionários */}
          <div className="grid gap-2">
            <Label htmlFor="employees">Número de Funcionários</Label>
            <Input
              id="employees"
              type="number"
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
            />
          </div>

          {/* Estágio */}
          <div className="grid gap-2">
            <Label htmlFor="stage">Estágio</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Expansão">Expansão</SelectItem>
                <SelectItem value="Renovação">Renovação</SelectItem>
                <SelectItem value="Churn">Churn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Conta */}
          <div className="grid gap-2">
            <Label htmlFor="accountType">Tipo de Conta</Label>
            <Select value={accountType} onValueChange={setAccountType}>
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

          {/* Status do Pipeline */}
          <div className="grid gap-2">
            <Label htmlFor="pipelineStatus">Status do Pipeline</Label>
            <Select value={pipelineStatus} onValueChange={setPipelineStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses
                  .sort((a, b) => a.order - b.order)
                  .map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* CSM Responsável */}
          <div className="grid gap-2">
            <Label htmlFor="csm">CSM Responsável</Label>
            <Select value={csm} onValueChange={setCsm}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um CSM" />
              </SelectTrigger>
              <SelectContent>
                {csms.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum CSM cadastrado
                  </SelectItem>
                ) : (
                  csms.map((csmItem) => (
                    <SelectItem key={csmItem.id} value={csmItem.name}>
                      {csmItem.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* MRR */}
          <div className="grid gap-2">
            <Label htmlFor="mrr">MRR (R$)</Label>
            <Input
              id="mrr"
              type="number"
              value={mrr}
              onChange={(e) => setMrr(Number(e.target.value))}
            />
          </div>

          {/* Valor do Contrato */}
          <div className="grid gap-2">
            <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
            <Input
              id="contractValue"
              type="number"
              value={contractValue}
              onChange={(e) => setContractValue(Number(e.target.value))}
            />
          </div>

          {/* Início do Contrato */}
          <div className="grid gap-2">
            <Label htmlFor="contractStart">Início do Contrato *</Label>
            <Input
              id="contractStart"
              type="date"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
            />
          </div>

          {/* Fim do Contrato */}
          <div className="grid gap-2">
            <Label htmlFor="contractEnd">Fim do Contrato *</Label>
            <Input
              id="contractEnd"
              type="date"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
            />
          </div>

          {/* Health Score */}
          <div className="grid gap-2">
            <Label htmlFor="healthScore">Health Score</Label>
            <Input
              id="healthScore"
              type="number"
              min="0"
              max="100"
              value={healthScore}
              onChange={(e) => setHealthScore(Number(e.target.value))}
            />
          </div>

          {/* Status de Saúde */}
          <div className="grid gap-2">
            <Label htmlFor="healthStatus">Status de Saúde</Label>
            <Select value={healthStatus} onValueChange={setHealthStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Saudável</SelectItem>
                <SelectItem value="at-risk">Em Risco</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

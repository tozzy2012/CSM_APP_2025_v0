import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      // Load existing kickoff data if available
      if (account.internalKickoff) {
        setKickoffData({
          salesRep: account.internalKickoff.salesRep || "",
          saleOrigin: account.internalKickoff.saleOrigin || "",
          saleOriginOther: account.internalKickoff.saleOriginOther || "",
          negotiatedWith: account.internalKickoff.negotiatedWith || "",
          customerSituation: account.internalKickoff.customerSituation || "",
          existingTools: account.internalKickoff.existingTools || "",
          painPoints: account.internalKickoff.painPoints || "",
          previousAttempts: account.internalKickoff.previousAttempts || "",
          expectedOutcomes: account.internalKickoff.expectedOutcomes || "",
          successCriteria: account.internalKickoff.successCriteria || "",
          businessImpact: account.internalKickoff.businessImpact || "",
          criticalDeadline: account.internalKickoff.criticalDeadline || "",
          urgencyReason: account.internalKickoff.urgencyReason || "",
          whyChoseUs: account.internalKickoff.whyChoseUs || "",
          competitorsConsidered: account.internalKickoff.competitorsConsidered || "",
          decisionCriteria: account.internalKickoff.decisionCriteria || "",
          negotiationDetails: account.internalKickoff.negotiationDetails || "",
          promisesMade: account.internalKickoff.promisesMade || "",
          redFlags: account.internalKickoff.redFlags || "",
          championIdentified: account.internalKickoff.championIdentified || "",
          communicationPreferences: account.internalKickoff.communicationPreferences || "",
        });
      }
    }
  }, [account]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateAccount(account.id, {
        ...formData,
        internalKickoff: kickoffData,
      });
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
      <DialogContent className="w-[90vw] max-w-[1800px] max-h-[95vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle>Editar Account: {account.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="kickoff">Kick Off Interno</TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Indústria</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Ex: Tecnologia, Saúde"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="csm">CSM Responsável</Label>
                <Select
                  value={formData.csm}
                  onValueChange={(value) =>
                    setFormData({ ...formData, csm: value })
                  }
                >
                  <SelectTrigger id="csm">
                    <SelectValue placeholder="Selecione o CSM" />
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
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage: value })
                  }
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Selecione o estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="adoption">Adoption</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="churn">Churn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMB">SMB</SelectItem>
                    <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
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
                <Label htmlFor="mrr">MRR (R$)</Label>
                <Input
                  id="mrr"
                  type="number"
                  value={formData.mrr}
                  onChange={(e) =>
                    setFormData({ ...formData, mrr: Number(e.target.value) })
                  }
                  placeholder="0"
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
                      contractValue: Number(e.target.value),
                    })
                  }
                  placeholder="0"
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
                <Label htmlFor="employees">Número de Funcionários</Label>
                <Input
                  id="employees"
                  type="number"
                  value={formData.employees}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employees: Number(e.target.value),
                    })
                  }
                  placeholder="0"
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
                  placeholder="https://exemplo.com"
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Kick Off Interno */}
          <TabsContent value="kickoff" className="space-y-6">
            {/* Vendas Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações de Vendas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesRep">Sales Rep</Label>
                  <Input
                    id="salesRep"
                    value={kickoffData.salesRep}
                    onChange={(e) =>
                      setKickoffData({ ...kickoffData, salesRep: e.target.value })
                    }
                    placeholder="Nome do vendedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saleOrigin">Origem da Venda</Label>
                  <Select
                    value={kickoffData.saleOrigin}
                    onValueChange={(value) =>
                      setKickoffData({ ...kickoffData, saleOrigin: value })
                    }
                  >
                    <SelectTrigger id="saleOrigin">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="parceiro">Parceiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {kickoffData.saleOrigin === "outro" && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="saleOriginOther">Especifique a origem</Label>
                    <Input
                      id="saleOriginOther"
                      value={kickoffData.saleOriginOther}
                      onChange={(e) =>
                        setKickoffData({
                          ...kickoffData,
                          saleOriginOther: e.target.value,
                        })
                      }
                      placeholder="Descreva a origem"
                    />
                  </div>
                )}

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="negotiatedWith">Negociado com</Label>
                  <Input
                    id="negotiatedWith"
                    value={kickoffData.negotiatedWith}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        negotiatedWith: e.target.value,
                      })
                    }
                    placeholder="Nome e cargo do decisor"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="negotiationDetails">Detalhes da Negociação</Label>
                  <Textarea
                    id="negotiationDetails"
                    value={kickoffData.negotiationDetails}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        negotiationDetails: e.target.value,
                      })
                    }
                    placeholder="Descreva o processo de negociação"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* SPICED Framework */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">SPICED Framework</h3>

              {/* Situation */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">S - Situation (Situação)</h4>
                <div className="space-y-2">
                  <Label htmlFor="customerSituation">Situação Atual do Cliente</Label>
                  <Textarea
                    id="customerSituation"
                    value={kickoffData.customerSituation}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        customerSituation: e.target.value,
                      })
                    }
                    placeholder="Como o cliente está operando hoje? Qual o contexto do negócio?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pain */}
              <div className="space-y-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">P - Pain (Dor)</h4>
                <div className="space-y-2">
                  <Label htmlFor="painPoints">Pain Points Identificados</Label>
                  <Textarea
                    id="painPoints"
                    value={kickoffData.painPoints}
                    onChange={(e) =>
                      setKickoffData({ ...kickoffData, painPoints: e.target.value })
                    }
                    placeholder="Quais são as dores e desafios principais?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Impact */}
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900">I - Impact (Impacto)</h4>
                <div className="space-y-2">
                  <Label htmlFor="businessImpact">Impacto no Negócio</Label>
                  <Textarea
                    id="businessImpact"
                    value={kickoffData.businessImpact}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        businessImpact: e.target.value,
                      })
                    }
                    placeholder="Qual o impacto real dessas dores no negócio? (financeiro, operacional, estratégico)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Critical Event */}
              <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900">C - Critical Event (Evento Crítico)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="criticalDeadline">Prazo Crítico</Label>
                    <Textarea
                      id="criticalDeadline"
                      value={kickoffData.criticalDeadline}
                      onChange={(e) =>
                        setKickoffData({
                          ...kickoffData,
                          criticalDeadline: e.target.value,
                        })
                      }
                      placeholder="Existe algum deadline ou evento importante?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgencyReason">Motivo da Urgência</Label>
                    <Textarea
                      id="urgencyReason"
                      value={kickoffData.urgencyReason}
                      onChange={(e) =>
                        setKickoffData({
                          ...kickoffData,
                          urgencyReason: e.target.value,
                        })
                      }
                      placeholder="Por que precisam resolver isso agora?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Evaluation */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900">E - Evaluation (Avaliação)</h4>
                <div className="space-y-2">
                  <Label htmlFor="decisionCriteria">Critérios de Decisão</Label>
                  <Textarea
                    id="decisionCriteria"
                    value={kickoffData.decisionCriteria}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        decisionCriteria: e.target.value,
                      })
                    }
                    placeholder="Como o cliente avaliou as soluções? Quais critérios foram usados?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Decision */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">D - Decision (Decisão)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="championIdentified">Champion Identificado</Label>
                    <Textarea
                      id="championIdentified"
                      value={kickoffData.championIdentified}
                      onChange={(e) =>
                        setKickoffData({
                          ...kickoffData,
                          championIdentified: e.target.value,
                        })
                      }
                      placeholder="Quem é o champion interno? Nome, cargo, influência"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="communicationPreferences">Preferências de Comunicação</Label>
                    <Textarea
                      id="communicationPreferences"
                      value={kickoffData.communicationPreferences}
                      onChange={(e) =>
                        setKickoffData({
                          ...kickoffData,
                          communicationPreferences: e.target.value,
                        })
                      }
                      placeholder="Como o decisor prefere se comunicar?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Informações Adicionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedOutcomes">Resultados Esperados</Label>
                  <Textarea
                    id="expectedOutcomes"
                    value={kickoffData.expectedOutcomes}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        expectedOutcomes: e.target.value,
                      })
                    }
                    placeholder="O que o cliente espera alcançar?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="successCriteria">Critérios de Sucesso</Label>
                  <Textarea
                    id="successCriteria"
                    value={kickoffData.successCriteria}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        successCriteria: e.target.value,
                      })
                    }
                    placeholder="Como vamos medir o sucesso?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promisesMade">Promessas Feitas</Label>
                  <Textarea
                    id="promisesMade"
                    value={kickoffData.promisesMade}
                    onChange={(e) =>
                      setKickoffData({
                        ...kickoffData,
                        promisesMade: e.target.value,
                      })
                    }
                    placeholder="Quais promessas foram feitas durante a venda?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redFlags">Red Flags</Label>
                  <Textarea
                    id="redFlags"
                    value={kickoffData.redFlags}
                    onChange={(e) =>
                      setKickoffData({ ...kickoffData, redFlags: e.target.value })
                    }
                    placeholder="Algum sinal de alerta ou ponto de atenção?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
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

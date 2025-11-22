/**
 * Team Management Component
 * Gerenciamento de CSMs e Times
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useTeamContext } from "@/contexts/TeamContext";

export default function TeamManagement() {
  const { csms, teams, createCSM, updateCSM, deleteCSM, createTeam, updateTeam, deleteTeam } =
    useTeamContext();

  const [isAddCSMOpen, setIsAddCSMOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);

  // CSM Form
  const [csmForm, setCSMForm] = useState({
    name: "",
    email: "",
    role: "",
    active: true,
  });

  // Team Form
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    members: [] as string[],
    color: "#3b82f6",
  });

  const handleCreateCSM = () => {
    if (!csmForm.name || !csmForm.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    createCSM(csmForm);
    toast.success("CSM criado com sucesso!");
    setIsAddCSMOpen(false);
    setCSMForm({ name: "", email: "", role: "", active: true });
  };

  const handleDeleteCSM = (id: string) => {
    if (confirm("Tem certeza que deseja remover este CSM?")) {
      deleteCSM(id);
      toast.success("CSM removido com sucesso!");
    }
  };

  const handleToggleCSMStatus = (id: string, active: boolean) => {
    updateCSM(id, { active });
    toast.success(active ? "CSM ativado!" : "CSM desativado!");
  };

  const handleCreateTeam = () => {
    if (!teamForm.name) {
      toast.error("Nome do time é obrigatório");
      return;
    }

    createTeam(teamForm);
    toast.success("Time criado com sucesso!");
    setIsAddTeamOpen(false);
    setTeamForm({ name: "", description: "", members: [], color: "#3b82f6" });
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm("Tem certeza que deseja remover este time?")) {
      deleteTeam(id);
      toast.success("Time removido com sucesso!");
    }
  };

  const toggleTeamMember = (memberId: string) => {
    if (teamForm.members.includes(memberId)) {
      setTeamForm({
        ...teamForm,
        members: teamForm.members.filter((id) => id !== memberId),
      });
    } else {
      setTeamForm({
        ...teamForm,
        members: [...teamForm.members, memberId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="csms" className="w-full">
        <TabsList>
          <TabsTrigger value="csms">CSMs ({csms.length})</TabsTrigger>
          <TabsTrigger value="teams">Times ({teams.length})</TabsTrigger>
        </TabsList>

        {/* CSMs Tab */}
        <TabsContent value="csms" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Customer Success Managers</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie os CSMs da sua equipe
                </p>
              </div>
              <Button onClick={() => setIsAddCSMOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar CSM
              </Button>
            </div>

            <div className="space-y-3">
              {csms.map((csm) => (
                <div
                  key={csm.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {csm.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{csm.name}</p>
                      <p className="text-sm text-muted-foreground">{csm.email}</p>
                      {csm.role && (
                        <Badge variant="outline" className="mt-1">
                          {csm.role}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${csm.id}`} className="text-sm">
                        {csm.active ? "Ativo" : "Inativo"}
                      </Label>
                      <Switch
                        id={`active-${csm.id}`}
                        checked={csm.active}
                        onCheckedChange={(checked) => handleToggleCSMStatus(csm.id, checked)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCSM(csm.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {csms.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhum CSM cadastrado</p>
                  <Button className="mt-4" onClick={() => setIsAddCSMOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro CSM
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Times</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Organize seus CSMs em times
                </p>
              </div>
              <Button onClick={() => setIsAddTeamOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Time
              </Button>
            </div>

            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 border border-border rounded-lg"
                  style={{ borderLeftColor: team.color, borderLeftWidth: "4px" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Membros:</span>
                    {team.members.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Nenhum membro</span>
                    ) : (
                      team.members.map((memberId) => {
                        const csm = csms.find((c) => c.id === memberId);
                        return csm ? (
                          <Badge key={memberId} variant="secondary">
                            {csm.name}
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nenhum time criado</p>
                  <Button className="mt-4" onClick={() => setIsAddTeamOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Time
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add CSM Dialog */}
      <Dialog open={isAddCSMOpen} onOpenChange={setIsAddCSMOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar CSM</DialogTitle>
            <DialogDescription>Cadastre um novo Customer Success Manager</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={csmForm.name}
                onChange={(e) => setCSMForm({ ...csmForm, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={csmForm.email}
                onChange={(e) => setCSMForm({ ...csmForm, email: e.target.value })}
                placeholder="joao@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={csmForm.role}
                onChange={(e) => setCSMForm({ ...csmForm, role: e.target.value })}
                placeholder="Ex: Senior CSM"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={csmForm.active}
                onCheckedChange={(checked) => setCSMForm({ ...csmForm, active: checked })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCSMOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCSM}>Adicionar CSM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Dialog */}
      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Time</DialogTitle>
            <DialogDescription>Organize seus CSMs em um novo time</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Nome do Time *</Label>
              <Input
                id="teamName"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="Ex: Enterprise"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Descreva o propósito deste time..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                type="color"
                value={teamForm.color}
                onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Membros</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {csms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum CSM disponível. Cadastre CSMs primeiro.
                  </p>
                ) : (
                  csms.map((csm) => (
                    <div key={csm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`member-${csm.id}`}
                        checked={teamForm.members.includes(csm.id)}
                        onChange={() => toggleTeamMember(csm.id)}
                        className="rounded"
                      />
                      <Label htmlFor={`member-${csm.id}`} className="cursor-pointer">
                        {csm.name} ({csm.email})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTeam}>Criar Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

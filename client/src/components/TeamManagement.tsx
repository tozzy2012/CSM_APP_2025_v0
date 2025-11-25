import { useState } from "react";
import { useTeamContext, CSM, Team } from "@/contexts/TeamContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamManagement() {
  const { csms, teams, addCSM, updateCSM, deleteCSM, addTeam, updateTeam, deleteTeam } = useTeamContext();

  // CSM Dialog State
  const [csmDialogOpen, setCsmDialogOpen] = useState(false);
  const [editingCSM, setEditingCSM] = useState<CSM | null>(null);
  const [csmForm, setCsmForm] = useState({ name: "", email: "", role: "" });

  // Team Dialog State
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: "", description: "", memberIds: [] as string[] });

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "csm" | "team"; id: string; name: string } | null>(null);

  // CSM Handlers
  const openAddCSMDialog = () => {
    setEditingCSM(null);
    setCsmForm({ name: "", email: "", role: "" });
    setCsmDialogOpen(true);
  };

  const openEditCSMDialog = (csm: CSM) => {
    setEditingCSM(csm);
    setCsmForm({ name: csm.name, email: csm.email, role: csm.role || "" });
    setCsmDialogOpen(true);
  };

  const handleSaveCSM = () => {
    if (!csmForm.name || !csmForm.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (editingCSM) {
      updateCSM(editingCSM.id, csmForm);
      toast.success("CSM atualizado com sucesso!");
    } else {
      addCSM(csmForm);
      toast.success("CSM adicionado com sucesso!");
    }

    setCsmDialogOpen(false);
  };

  // Team Handlers
  const openAddTeamDialog = () => {
    setEditingTeam(null);
    setTeamForm({ name: "", description: "", memberIds: [] });
    setTeamDialogOpen(true);
  };

  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({ name: team.name, description: team.description || "", memberIds: team.memberIds });
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = () => {
    if (!teamForm.name) {
      toast.error("Nome do time é obrigatório");
      return;
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, teamForm);
      toast.success("Time atualizado com sucesso!");
    } else {
      addTeam(teamForm);
      toast.success("Time criado com sucesso!");
    }

    setTeamDialogOpen(false);
  };

  // Delete Handler
  const openDeleteDialog = (type: "csm" | "team", id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "csm") {
      deleteCSM(deleteTarget.id);
      toast.success("CSM removido com sucesso!");
    } else {
      deleteTeam(deleteTarget.id);
      toast.success("Time removido com sucesso!");
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const toggleTeamMember = (memberId: string) => {
    setTeamForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="csms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csms">
            <UserPlus className="w-4 h-4 mr-2" />
            CSMs
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="w-4 h-4 mr-2" />
            Times
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csms" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Customer Success Managers</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os membros da equipe de CS
              </p>
            </div>
            <Button onClick={openAddCSMDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar CSM
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum CSM cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                csms.map((csm) => (
                  <TableRow key={csm.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {csm.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{csm.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{csm.email}</TableCell>
                    <TableCell>
                      {csm.role && <Badge variant="secondary">{csm.role}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCSMDialog(csm)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => openDeleteDialog("csm", csm.id, csm.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Times</h3>
              <p className="text-sm text-muted-foreground">
                Organize CSMs em times e grupos
              </p>
            </div>
            <Button onClick={openAddTeamDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Time
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum time cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {team.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.memberIds.length} membros</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTeamDialog(team)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => openDeleteDialog("team", team.id, team.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* CSM Dialog */}
      <Dialog open={csmDialogOpen} onOpenChange={setCsmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCSM ? "Editar CSM" : "Adicionar CSM"}</DialogTitle>
            <DialogDescription>
              {editingCSM ? "Atualize as informações do CSM" : "Adicione um novo membro à equipe"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csm-name">Nome *</Label>
              <Input
                id="csm-name"
                value={csmForm.name}
                onChange={(e) => setCsmForm({ ...csmForm, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csm-email">Email *</Label>
              <Input
                id="csm-email"
                type="email"
                value={csmForm.email}
                onChange={(e) => setCsmForm({ ...csmForm, email: e.target.value })}
                placeholder="joao@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csm-role">Cargo</Label>
              <Input
                id="csm-role"
                value={csmForm.role}
                onChange={(e) => setCsmForm({ ...csmForm, role: e.target.value })}
                placeholder="Ex: Senior CSM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCSM}>
              {editingCSM ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Editar Time" : "Criar Time"}</DialogTitle>
            <DialogDescription>
              {editingTeam ? "Atualize as informações do time" : "Crie um novo time"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nome *</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="Ex: CS Team A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Descrição</Label>
              <Textarea
                id="team-description"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Descrição opcional do time"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Membros</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                {csms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum CSM disponível
                  </p>
                ) : (
                  csms.map((csm) => (
                    <label
                      key={csm.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={teamForm.memberIds.includes(csm.id)}
                        onChange={() => toggleTeamMember(csm.id)}
                        className="rounded"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {csm.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{csm.name}</p>
                        <p className="text-xs text-muted-foreground">{csm.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTeam}>
              {editingTeam ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === "csm" && " Este CSM será removido de todos os times."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

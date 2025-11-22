/**
 * Team Management Page
 * Página para Admin da Organização gerenciar seus CSMs
 */
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Edit, Key, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/auth";

export default function Team() {
  const { currentUser } = useAuth();
  const { users, createUser, updateUser, deleteUser, changePassword } = useUsers();

  // Filtrar usuários da organização do admin logado
  const teamUsers = users.filter(
    (user) => user.organizationId === currentUser?.organizationId
  );

  // Estados para modais
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Estados para formulário de adicionar usuário
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.CSM);

  // Estados para formulário de editar usuário
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.CSM);

  // Estados para formulário de alterar senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    // Verificar se email já existe
    const emailExists = users.some((u) => u.email === newUserEmail);
    if (emailExists) {
      toast.error("Este email já está cadastrado");
      return;
    }

    // Apenas Super Admin pode criar ORG_ADMIN
    if (newUserRole === UserRole.ORG_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      toast.error("Apenas Super Admin pode criar Admins de Organização");
      return;
    }

    createUser({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      organizationId: currentUser?.organizationId || "",
      active: true,
    });

    toast.success("Usuário criado com sucesso!");
    setShowAddUser(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole(UserRole.CSM);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    if (!editUserName || !editUserEmail) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Verificar se email já existe (exceto o próprio usuário)
    const emailExists = users.some(
      (u) => u.email === editUserEmail && u.id !== selectedUser.id
    );
    if (emailExists) {
      toast.error("Este email já está cadastrado");
      return;
    }

    // Apenas Super Admin pode mudar role para ORG_ADMIN
    if (editUserRole === UserRole.ORG_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      toast.error("Apenas Super Admin pode criar Admins de Organização");
      return;
    }

    updateUser(selectedUser.id, {
      name: editUserName,
      email: editUserEmail,
      role: editUserRole,
    });

    toast.success("Usuário atualizado com sucesso!");
    setShowEditUser(false);
    setSelectedUser(null);
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;

    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    changePassword(selectedUser.id, newPassword);
    toast.success("Senha alterada com sucesso!");
    setShowChangePassword(false);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteUser = (user: any) => {
    // Não pode excluir a si mesmo
    if (user.id === currentUser?.id) {
      toast.error("Você não pode excluir sua própria conta");
      return;
    }

    // Verificar se é o último admin da organização
    const orgAdmins = teamUsers.filter((u) => u.role === UserRole.ORG_ADMIN);
    if (user.role === UserRole.ORG_ADMIN && orgAdmins.length === 1) {
      toast.error("Não é possível excluir o último administrador da organização");
      return;
    }

    if (confirm(`Tem certeza que deseja excluir ${user.name}?`)) {
      deleteUser(user.id);
      toast.success("Usuário excluído com sucesso!");
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setShowEditUser(true);
  };

  const openChangePasswordModal = (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(true);
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === UserRole.SUPER_ADMIN) {
      return <Badge variant="destructive">Super Admin</Badge>;
    }
    if (role === UserRole.ORG_ADMIN) {
      return <Badge variant="default">Admin</Badge>;
    }
    return <Badge variant="secondary">CSM</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gerenciamento de Equipe
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários da sua organização
          </p>
        </div>
        <Button onClick={() => setShowAddUser(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Tabela de Usuários */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              teamUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openChangePasswordModal(user)}
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Adicionar Usuário */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) => setNewUserRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CSM}>CSM</SelectItem>
                  {currentUser?.role === UserRole.SUPER_ADMIN && (
                    <SelectItem value={UserRole.ORG_ADMIN}>Admin da Organização</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuário */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={editUserRole}
                onValueChange={(value) => setEditUserRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CSM}>CSM</SelectItem>
                  {currentUser?.role === UserRole.SUPER_ADMIN && (
                    <SelectItem value={UserRole.ORG_ADMIN}>Admin da Organização</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Alterar Senha */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha de {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>Alterar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Building2,
    Users,
    Shield,
    Plus,
    Pencil,
    ToggleLeft,
    ToggleRight,
    Eye,
} from "lucide-react";
import type { Organization } from "@/types/auth";
import type { User, UserRole } from "@/types/auth";

export default function SuperAdmin() {
    const { currentUser } = useAuth();
    const { organizations, createOrganization, updateOrganization } = useOrganizations();
    const { users, createUser, getUsersByOrganization } = useUsers();

    // Dialog states
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
    const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);
    const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

    // Selected organization
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    // Form states
    const [orgFormData, setOrgFormData] = useState({
        name: "",
        subdomain: "",
        plan: "starter" as "starter" | "pro" | "enterprise",
        status: "active" as "active" | "inactive",
    });

    const [adminFormData, setAdminFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    // Redirect if not super admin
    if (currentUser?.role !== "SUPER_ADMIN") {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-8 max-w-md text-center">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
                    <p className="text-muted-foreground">
                        Você não tem permissão para acessar esta área.
                    </p>
                </Card>
            </div>
        );
    }

    // Stats
    const activeOrgs = organizations.filter((org) => org.status === "active").length;
    const totalAdmins = users.filter((u) => u.role === "ORG_ADMIN").length;

    // Handlers
    const handleCreateOrg = () => {
        console.log("handleCreateOrg called", orgFormData);

        if (!orgFormData.name || !orgFormData.subdomain) {
            toast.error("Nome e subdomínio são obrigatórios");
            return;
        }

        const newOrg = createOrganization({
            name: orgFormData.name,
            subdomain: orgFormData.subdomain,
            plan: orgFormData.plan,
            status: orgFormData.status,
            active: orgFormData.status === "active",
        });

        console.log("Organization created:", newOrg);
        console.log("Total organizations:", organizations.length + 1);

        toast.success("Organização criada com sucesso!");
        setIsCreateOrgOpen(false);
        setOrgFormData({
            name: "",
            subdomain: "",
            plan: "starter",
            status: "active",
        });
    };

    const handleUpdateOrg = () => {
        if (!selectedOrg) return;

        updateOrganization(selectedOrg.id, {
            name: orgFormData.name,
            subdomain: orgFormData.subdomain,
            plan: orgFormData.plan,
            status: orgFormData.status,
            active: orgFormData.status === "active",
        });

        toast.success("Organização atualizada!");
        setIsEditOrgOpen(false);
    };

    const handleToggleOrgStatus = (org: Organization) => {
        const newStatus = org.status === "active" ? "inactive" : "active";
        updateOrganization(org.id, {
            status: newStatus,
            active: newStatus === "active",
        });
        toast.success(`Organização ${newStatus === "active" ? "ativada" : "desativada"}!`);
    };

    const handleCreateAdmin = () => {
        if (!selectedOrg || !adminFormData.name || !adminFormData.email || !adminFormData.password) {
            toast.error("Todos os campos são obrigatórios");
            return;
        }

        createUser({
            name: adminFormData.name,
            email: adminFormData.email,
            password: adminFormData.password,
            role: "ORG_ADMIN" as UserRole,
            organizationId: selectedOrg.id,
            active: true,
        });

        toast.success("Admin criado com sucesso!");
        setIsCreateAdminOpen(false);
        setAdminFormData({ name: "", email: "", password: "" });
    };

    const openEditOrg = (org: Organization) => {
        setSelectedOrg(org);
        setOrgFormData({
            name: org.name,
            subdomain: org.subdomain || "",
            plan: org.plan || "starter",
            status: org.status || "active",
        });
        setIsEditOrgOpen(true);
    };

    const openManageAdmins = (org: Organization) => {
        setSelectedOrg(org);
        setIsManageAdminsOpen(true);
    };

    const getOrgAdmins = (orgId: string): User[] => {
        return getUsersByOrganization(orgId).filter((u) => u.role === "ORG_ADMIN");
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-blue-600" />
                            Super Admin
                        </h1>
                        <p className="text-muted-foreground">
                            Gerenciar organizações e administradores
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOrgOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Organização
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Organizações</p>
                                    <p className="text-2xl font-bold">{organizations.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Building2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Organizações Ativas</p>
                                    <p className="text-2xl font-bold">{activeOrgs}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Admins</p>
                                    <p className="text-2xl font-bold">{totalAdmins}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Organizations Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organizações</CardTitle>
                        <CardDescription>
                            Gerencie todas as organizações do sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Subdomínio</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Admins</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organizations.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-medium">{org.name}</TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {org.subdomain || "N/A"}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {org.plan || "starter"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={org.status === "active" ? "default" : "secondary"}
                                                className={org.status === "active" ? "bg-green-600" : ""}
                                            >
                                                {org.status === "active" ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getOrgAdmins(org.id).length}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openManageAdmins(org)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditOrg(org)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleOrgStatus(org)}
                                                >
                                                    {org.status === "active" ? (
                                                        <ToggleRight className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create Organization Dialog */}
                <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Organização</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="org-name">Nome</Label>
                                <Input
                                    id="org-name"
                                    value={orgFormData.name}
                                    onChange={(e) =>
                                        setOrgFormData({ ...orgFormData, name: e.target.value })
                                    }
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org-subdomain">Subdomínio</Label>
                                <Input
                                    id="org-subdomain"
                                    value={orgFormData.subdomain}
                                    onChange={(e) =>
                                        setOrgFormData({ ...orgFormData, subdomain: e.target.value })
                                    }
                                    placeholder="acme"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org-plan">Plano</Label>
                                <Select
                                    value={orgFormData.plan}
                                    onValueChange={(value: "starter" | "pro" | "enterprise") =>
                                        setOrgFormData({ ...orgFormData, plan: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateOrg}>Criar Organização</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Organization Dialog */}
                <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Organização</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-org-name">Nome</Label>
                                <Input
                                    id="edit-org-name"
                                    value={orgFormData.name}
                                    onChange={(e) =>
                                        setOrgFormData({ ...orgFormData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-org-subdomain">Subdomínio</Label>
                                <Input
                                    id="edit-org-subdomain"
                                    value={orgFormData.subdomain}
                                    onChange={(e) =>
                                        setOrgFormData({ ...orgFormData, subdomain: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-org-plan">Plano</Label>
                                <Select
                                    value={orgFormData.plan}
                                    onValueChange={(value: "starter" | "pro" | "enterprise") =>
                                        setOrgFormData({ ...orgFormData, plan: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-org-status">Status</Label>
                                <Select
                                    value={orgFormData.status}
                                    onValueChange={(value: "active" | "inactive") =>
                                        setOrgFormData({ ...orgFormData, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="inactive">Inativa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsEditOrgOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleUpdateOrg}>Salvar Alterações</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Manage Admins Dialog */}
                <Dialog open={isManageAdminsOpen} onOpenChange={setIsManageAdminsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Admins - {selectedOrg?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-muted-foreground">
                                    {getOrgAdmins(selectedOrg?.id || "").length} administrador(es)
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setIsCreateAdminOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo Admin
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getOrgAdmins(selectedOrg?.id || "").map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell className="font-medium">{admin.name}</TableCell>
                                            <TableCell>{admin.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={admin.active ? "default" : "secondary"}>
                                                    {admin.active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {getOrgAdmins(selectedOrg?.id || "").length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Nenhum admin cadastrado
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Admin Dialog */}
                <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Administrador</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin-name">Nome</Label>
                                <Input
                                    id="admin-name"
                                    value={adminFormData.name}
                                    onChange={(e) =>
                                        setAdminFormData({ ...adminFormData, name: e.target.value })
                                    }
                                    placeholder="João Silva"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin-email">Email</Label>
                                <Input
                                    id="admin-email"
                                    type="email"
                                    value={adminFormData.email}
                                    onChange={(e) =>
                                        setAdminFormData({ ...adminFormData, email: e.target.value })
                                    }
                                    placeholder="joao@acme.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin-password">Senha</Label>
                                <Input
                                    id="admin-password"
                                    type="password"
                                    value={adminFormData.password}
                                    onChange={(e) =>
                                        setAdminFormData({ ...adminFormData, password: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsCreateAdminOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateAdmin}>Criar Admin</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { apiClient } from "@/api";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, Trash2, Copy, CheckCircle, XCircle, Clock, Edit, Ban, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invite {
    id: string;
    email: string;
    role: string;
    status: "pending" | "accepted" | "revoked";
    token: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt?: string;
}

interface InviteListProps {
    refreshTrigger?: number;
}

export default function InviteList({ refreshTrigger }: InviteListProps) {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
    const [newRole, setNewRole] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInvites();
    }, [refreshTrigger]);

    const fetchInvites = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<Invite[]>("/api/v1/invites");
            setInvites(data);
        } catch (error) {
            console.error("Error fetching invites:", error);
            toast.error("Erro ao carregar convites");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Tem certeza que deseja revogar este convite?")) return;

        try {
            await apiClient.delete(`/api/v1/invites/${id}`);
            toast.success("Convite revogado");
            fetchInvites();
        } catch (error) {
            console.error("Error revoking invite:", error);
            toast.error("Erro ao revogar convite");
        }
    };

    const handleDeletePermanent = async (id: string) => {
        if (!confirm("ATENÇÃO: Isso excluirá o convite permanentemente do banco de dados. Deseja continuar?")) return;

        try {
            await apiClient.delete(`/api/v1/invites/${id}/permanent`);
            toast.success("Convite excluído permanentemente");
            fetchInvites();
        } catch (error) {
            console.error("Error deleting invite:", error);
            toast.error("Erro ao excluir convite");
        }
    };

    const handleEditClick = (invite: Invite) => {
        setEditingInvite(invite);
        setNewRole(invite.role);
    };

    const handleSaveRole = async () => {
        if (!editingInvite) return;
        setSaving(true);
        try {
            await apiClient.patch(`/api/v1/invites/${editingInvite.id}`, {
                role: newRole
            });
            toast.success("Função atualizada com sucesso");
            setEditingInvite(null);
            fetchInvites();
        } catch (error) {
            console.error("Error updating invite:", error);
            toast.error("Erro ao atualizar função");
        } finally {
            setSaving(false);
        }
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/login?invite=${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
            case "accepted":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Aceito</Badge>;
            case "revoked":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Revogado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <CardContent className="pt-6">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : invites.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                    Nenhum convite encontrado.
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Enviado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invites.map((invite) => (
                                <TableRow key={invite.id}>
                                    <TableCell>
                                        <div className="font-medium">{invite.email}</div>
                                        <div className="text-xs text-muted-foreground">{invite.role}</div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(invite.status)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(invite.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {invite.status === "pending" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => copyInviteLink(invite.token)}
                                                        title="Copiar Link"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(invite)}
                                                        title="Editar Função"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                                        onClick={() => handleRevoke(invite.id)}
                                                        title="Revogar"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeletePermanent(invite.id)}
                                                title="Excluir Permanentemente"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={!!editingInvite} onOpenChange={(open) => !open && setEditingInvite(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Função</DialogTitle>
                        <DialogDescription>
                            Altere a função do usuário convidado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Nova Função</label>
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CSM">CSM</SelectItem>
                                <SelectItem value="ORG_ADMIN">Admin da Organização</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingInvite(null)}>Cancelar</Button>
                        <Button onClick={handleSaveRole} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
    );
}

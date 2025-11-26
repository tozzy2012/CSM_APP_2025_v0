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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Trash2, Copy, CheckCircle, XCircle, Clock } from "lucide-react";
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

export default function Invites() {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form state
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("CSM");

    useEffect(() => {
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
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

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSending(true);
        try {
            await apiClient.post("/api/v1/invites", {
                email,
                role,
                organizationId: null // TODO: Add org selection if needed
            });

            toast.success(`Convite enviado para ${email}`);
            setEmail("");
            fetchInvites();
        } catch (error: any) {
            console.error("Error sending invite:", error);
            const msg = error.detail || "Erro ao enviar convite";
            toast.error(msg);
        } finally {
            setSending(false);
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Convites</h1>
                <p className="text-muted-foreground">
                    Envie convites para novos membros da equipe e gerencie o acesso à plataforma.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Invite Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Novo Convite</CardTitle>
                        <CardDescription>
                            Envie um email com link de acesso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="email@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Função (Role)</label>
                                <Select value={role} onValueChange={setRole}>
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

                            <Button type="submit" className="w-full" disabled={sending}>
                                {sending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Enviar Convite
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Invites List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Histórico de Convites</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleRevoke(invite.id)}
                                                                    title="Revogar"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

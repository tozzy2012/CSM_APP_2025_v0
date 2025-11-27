import { useState } from "react";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";

interface InviteFormProps {
    onSuccess?: () => void;
}

export default function InviteForm({ onSuccess }: InviteFormProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("CSM");
    const [sending, setSending] = useState(false);

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSending(true);
        try {
            await apiClient.post("/api/v1/invites", {
                email,
                role,
                organizationId: null
            });

            toast.success(`Convite enviado para ${email}`);
            setEmail("");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Error sending invite:", error);
            const msg = error.detail || "Erro ao enviar convite";
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    return (
        <CardContent className="pt-6">
            <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <Button type="submit" className="w-full md:w-auto" disabled={sending}>
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
    );
}

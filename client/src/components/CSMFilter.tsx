import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTeamContext } from "@/contexts/TeamContext";
import { Users } from "lucide-react";

interface CSMFilterProps {
    selectedCSM: string;
    onCSMChange: (csmId: string) => void;
}

export default function CSMFilter({ selectedCSM, onCSMChange }: CSMFilterProps) {
    const { csms } = useTeamContext();

    return (
        <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCSM} onValueChange={onCSMChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por CSM" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os CSMs</SelectItem>
                    {csms.map((csm) => (
                        <SelectItem key={csm.id} value={csm.id}>
                            {csm.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

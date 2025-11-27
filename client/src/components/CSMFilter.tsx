import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamContext } from "@/contexts/TeamContext";
import { Users, User } from "lucide-react";

interface CSMFilterProps {
    selectedCSM: string;
    onCSMChange: (csmId: string) => void;
}

export default function CSMFilter({ selectedCSM, onCSMChange }: CSMFilterProps) {
    const { csms } = useTeamContext();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const selectedCSMData = csms.find(c => c.name === selectedCSM || c.id === selectedCSM);

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                Filtrar por:
            </span>
            <Select value={selectedCSM} onValueChange={onCSMChange}>
                <SelectTrigger className="w-[240px] h-10 bg-white border-gray-200 hover:border-blue-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-2">
                        {selectedCSM === "all" ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                                <Users className="w-3.5 h-3.5" />
                            </div>
                        ) : (
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={selectedCSMData?.avatar} />
                                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                    {selectedCSMData ? getInitials(selectedCSMData.name) : "??"}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <SelectValue placeholder="Selecione um CSM" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                                <Users className="w-3.5 h-3.5" />
                            </div>
                            <span>Todos os CSMs</span>
                        </div>
                    </SelectItem>
                    {csms.map((csm) => (
                        <SelectItem key={csm.id} value={csm.name} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={csm.avatar} />
                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                        {getInitials(csm.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{csm.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

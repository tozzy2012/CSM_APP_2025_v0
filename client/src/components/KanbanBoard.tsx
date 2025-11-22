/**
 * Kanban Board Component - Estilo HubSpot
 * Visualização drag & drop de accounts por status
 */
import { useState } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccountsContext, Account } from "@/contexts/AccountsContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { Building2, User, DollarSign, MoreVertical, Pencil } from "lucide-react";
import { Link } from "wouter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditAccountDialog from "@/components/EditAccountDialog";

interface DraggableAccountCardProps {
    account: Account;
}

function DraggableAccountCard({ account }: DraggableAccountCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: account.id,
        });

    const [isEditOpen, setIsEditOpen] = useState(false);

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            opacity: isDragging ? 0.5 : 1,
        }
        : undefined;

    const getInitials = (name: string) => {
        if (!name) return "?";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "Saudável": "bg-green-100 text-green-700 border-green-200",
            "Atenção": "bg-yellow-100 text-yellow-700 border-yellow-200",
            "Crítico": "bg-red-100 text-red-700 border-red-200",
            "Salvamento": "bg-orange-100 text-orange-700 border-orange-200",
            "Upsell": "bg-blue-100 text-blue-700 border-blue-200",
            "Churn": "bg-gray-100 text-gray-700 border-gray-200",
            "Inadimplente": "bg-purple-100 text-purple-700 border-purple-200",
        };
        return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
    };

    return (
        <>
            <div ref={setNodeRef} style={style}>
                <Card className="group p-4 hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-blue-300">
                    <div className="space-y-3">
                        {/* Header com nome e menu */}
                        <div className="flex items-start justify-between">
                            <Link href={`/accounts/${account.id}`}>
                                <a className="flex-1">
                                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer">
                                        {account.name}
                                    </h4>
                                </a>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* CSM com Avatar - Drag handle area */}
                        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
                            {account.csm && (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                            {getInitials(account.csm)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-gray-600">{account.csm}</span>
                                </div>
                            )}

                            {/* MRR */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                    <span className="font-semibold text-sm text-green-600">
                                        R$ {account.mrr.toLocaleString("pt-BR")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">MRR</span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                {account.type && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-0 h-5 bg-gray-50 text-gray-700 border-gray-200"
                                    >
                                        {account.type}
                                    </Badge>
                                )}
                                {account.status && (
                                    <Badge
                                        variant="outline"
                                        className={`text-xs px-2 py-0 h-5 border ${getStatusColor(
                                            account.status
                                        )}`}
                                    >
                                        {account.status}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Edit Dialog */}
            {isEditOpen && (
                <EditAccountDialog
                    account={account}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                />
            )}
        </>
    );
}

interface KanbanColumnProps {
    status: string;
    color: string;
    accounts: Account[];
}

function KanbanColumn({ status, color, accounts }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            green: "bg-green-50/50",
            yellow: "bg-yellow-50/50",
            red: "bg-red-50/50",
            orange: "bg-orange-50/50",
            blue: "bg-blue-50/50",
            gray: "bg-gray-50/50",
            purple: "bg-purple-50/50",
        };
        return colors[color] || "bg-gray-50/50";
    };

    const getHeaderColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            green: "text-green-700",
            yellow: "text-yellow-700",
            red: "text-red-700",
            orange: "text-orange-700",
            blue: "text-blue-700",
            gray: "text-gray-700",
            purple: "text-purple-700",
        };
        return colors[color] || "text-gray-700";
    };

    const getDotColor = (color: string) => {
        const colors: Record<string, string> = {
            green: "bg-green-500",
            yellow: "bg-yellow-500",
            red: "bg-red-500",
            orange: "bg-orange-500",
            blue: "bg-blue-500",
            gray: "bg-gray-500",
            purple: "bg-purple-500",
        };
        return colors[color] || "bg-gray-500";
    };

    const totalMRR = accounts.reduce((sum, account) => sum + account.mrr, 0);

    return (
        <div className="flex flex-col min-w-[320px] max-w-[320px]">
            {/* Header */}
            <div className="p-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDotColor(color)}`}></div>
                        <h3 className={`font-semibold text-sm ${getHeaderColorClasses(color)}`}>
                            {status}
                        </h3>
                    </div>
                    <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0 h-5 bg-gray-100 text-gray-600"
                    >
                        {accounts.length}
                    </Badge>
                </div>
                {totalMRR > 0 && (
                    <div className="text-xs text-gray-500">
                        R$ {(totalMRR / 1000).toFixed(1)}K MRR
                    </div>
                )}
            </div>

            {/* Cards Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 space-y-3 min-h-[600px] ${getColorClasses(
                    color
                )} ${isOver ? "ring-2 ring-blue-400 ring-inset" : ""} transition-all`}
            >
                {accounts.map((account) => (
                    <DraggableAccountCard key={account.id} account={account} />
                ))}

                {accounts.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        Arraste contas aqui
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanBoard() {
    const { accounts, updateAccount } = useAccountsContext();
    const { statuses } = useAccountStatus();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const accountId = active.id as string;
        const newStatus = over.id as string;

        // Atualizar status da account
        updateAccount(accountId, { status: newStatus });

        setActiveId(null);
    };

    const activeAccount = activeId
        ? accounts.find((a) => a.id === activeId)
        : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-0 overflow-x-auto pb-4">
                {statuses
                    .sort((a, b) => a.order - b.order)
                    .map((status) => {
                        const statusAccounts = accounts.filter(
                            (account) => account.status === status.name
                        );

                        return (
                            <KanbanColumn
                                key={status.id}
                                status={status.name}
                                color={status.color}
                                accounts={statusAccounts}
                            />
                        );
                    })}
            </div>

            <DragOverlay>
                {activeAccount ? (
                    <Card className="p-4 shadow-2xl rotate-2 bg-white opacity-95 border-2 border-blue-400">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-600" />
                                <h4 className="font-semibold text-sm">{activeAccount.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="h-3 w-3" />
                                <span>{activeAccount.csm || "Sem CSM"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                <span className="font-semibold text-sm text-green-600">
                                    R$ {activeAccount.mrr.toLocaleString("pt-BR")}
                                </span>
                            </div>
                        </div>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

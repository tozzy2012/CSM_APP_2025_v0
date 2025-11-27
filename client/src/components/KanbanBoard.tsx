/**
 * Kanban Board Component - Estilo HubSpot
 * Visualização drag & drop de accounts por status
 */
import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccountsContext, Account } from "@/contexts/AccountsContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { Building2, User, DollarSign, MoreVertical, Pencil, Eye } from "lucide-react";
import { Link } from "wouter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditAccountDialog from "@/components/EditAccountDialog";

interface SortableAccountCardProps {
    account: Account;
}

function SortableAccountCard({ account }: SortableAccountCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: account.id,
        data: {
            type: "Account",
            account,
        },
        transition: {
            duration: 200,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
    });

    const [isEditOpen, setIsEditOpen] = useState(false);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? transition : "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: isDragging ? 0.4 : 1,
    };

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

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg h-[140px] w-full"
            />
        );
    }

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Card className="group p-4 hover:shadow-md transition-all duration-200 bg-white border border-gray-200 hover:border-blue-300 cursor-grab active:cursor-grabbing">
                    <div className="space-y-3">
                        {/* Header com nome e menu */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {account.name}
                                </h4>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Quick access button */}
                                <Link href={`/accounts/${account.id}`}>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start only
                                        title="Abrir conta"
                                    >
                                        <Eye className="h-4 w-4 text-blue-600" />
                                    </button>
                                </Link>
                                {/* Dropdown menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
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
                        </div>

                        {/* CSM com Avatar */}
                        <div>
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
    const { setNodeRef } = useDroppable({
        id: status,
        data: {
            type: "Column",
            status,
        },
    });

    const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts]);

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
            <div className="p-4 pb-3 bg-white border-b border-gray-200 rounded-t-lg">
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
                className={`flex-1 p-3 space-y-3 min-h-[600px] rounded-b-lg ${getColorClasses(
                    color
                )} transition-colors`}
            >
                <SortableContext items={accountIds} strategy={verticalListSortingStrategy}>
                    {accounts.map((account) => (
                        <SortableAccountCard key={account.id} account={account} />
                    ))}
                </SortableContext>

                {accounts.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg bg-white/50">
                        Arraste contas aqui
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanBoard({ accounts: externalAccounts }: { accounts?: Account[] }) {
    const { accounts: contextAccounts, updateAccount } = useAccountsContext();
    const { statuses } = useAccountStatus();
    const [activeAccount, setActiveAccount] = useState<Account | null>(null);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Use external accounts if provided, otherwise use context accounts
    const accounts = externalAccounts !== undefined ? externalAccounts : contextAccounts;
    const [items, setItems] = useState<Account[]>([]);

    // Sync items with accounts from context, but only if not dragging (to avoid jitter)
    useEffect(() => {
        if (!activeId) {
            setItems(accounts);
        }
    }, [accounts, activeId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Account") {
            setActiveAccount(event.active.data.current.account);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAccount = active.data.current?.type === "Account";
        const isOverAccount = over.data.current?.type === "Account";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveAccount) return;

        // Find the active item in our local state
        const activeItemIndex = items.findIndex((i) => i.id === activeId);
        if (activeItemIndex === -1) return;

        const activeItem = items[activeItemIndex];

        // Dropping over a column
        if (isOverColumn) {
            const overColumnStatus = over.data.current?.status;

            // If dragging over a different column, update the item's status locally
            if (activeItem.status !== overColumnStatus) {
                setItems((prev) => {
                    const newItems = [...prev];
                    newItems[activeItemIndex] = { ...activeItem, status: overColumnStatus };
                    return newItems;
                });
            }
        }

        // Dropping over another account
        if (isOverAccount) {
            const overItemIndex = items.findIndex((i) => i.id === overId);
            if (overItemIndex === -1) return;

            const overItem = items[overItemIndex];

            // If the over item has a different status, adopt it
            if (activeItem.status !== overItem.status) {
                setItems((prev) => {
                    const newItems = [...prev];
                    newItems[activeItemIndex] = { ...activeItem, status: overItem.status };
                    return arrayMove(newItems, activeItemIndex, overItemIndex);
                });
            } else {
                // Same column reordering
                setItems((prev) => arrayMove(prev, activeItemIndex, overItemIndex));
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveAccount(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the account being dragged (from local state which has the latest status)
        const account = items.find((a) => a.id === activeId);
        if (!account) return;

        // Determine final status
        let newStatus = account.status;

        // We can trust the local state status because handleDragOver updated it
        // But let's double check if we dropped on a column just to be safe
        const overColumn = statuses.find((s) => s.name === overId) || (overId === "Sem Status" ? { name: "Sem Status" } : null);
        if (overColumn) {
            newStatus = overColumn.name;
        }

        // Persist to backend
        // We compare against the ORIGINAL account status from context to see if it changed
        const originalAccount = accounts.find(a => a.id === activeId);

        if (originalAccount && newStatus !== originalAccount.status) {
            console.log("Persisting status change:", { id: activeId, from: originalAccount.status, to: newStatus });
            updateAccount(activeId, { status: newStatus })
                .catch((err) => {
                    console.error("Update failed:", err);
                    // Revert local state on failure
                    setItems(accounts);
                });
        }
    };

    const dropAnimation: DropAnimation = {
        duration: 300,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.6',
                },
            },
        }),
    };

    const normalizeStatus = (status: string) => status?.trim() || "";

    // Use 'items' (local state) instead of 'accounts' (context) for rendering
    const uncategorizedAccounts = items.filter(
        (account) => !statuses.some((s) => normalizeStatus(s.name) === normalizeStatus(account.status))
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 px-1">
                {/* Uncategorized Column */}
                {uncategorizedAccounts.length > 0 && (
                    <KanbanColumn
                        key="uncategorized"
                        status="Sem Status"
                        color="gray"
                        accounts={uncategorizedAccounts}
                    />
                )}

                {statuses
                    .sort((a, b) => a.order - b.order)
                    .map((status) => {
                        const statusAccounts = items.filter(
                            (account) => normalizeStatus(account.status) === normalizeStatus(status.name)
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

            <DragOverlay dropAnimation={dropAnimation}>
                {activeAccount ? (
                    <Card className="p-4 shadow-2xl scale-105 rotate-2 bg-white opacity-90 border-2 border-blue-500 cursor-grabbing">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-600" />
                                <h4 className="font-semibold text-sm">{activeAccount.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="h-3 w-3" />
                                <span className="text-gray-900">{activeAccount.csm || "Sem CSM"}</span>
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

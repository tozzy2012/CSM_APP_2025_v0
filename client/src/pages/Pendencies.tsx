/**
 * Pendências (Pending Items) Page
 * Premium CSM Productivity Tool
 */
import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
    AlertCircle,
    AlertTriangle,
    Activity as ActivityIcon,
    CheckCircle2,
    Clock,
    FileText,
    TrendingDown,
    Calendar,
    Database,
    ChevronRight,
    Filter,
    Users,
    Target,
    Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { usePendencies, PendingItem } from '@/hooks/usePendencies';
import CSMFilter from '@/components/CSMFilter';

export default function Pendencies() {
    const [selectedCSM, setSelectedCSM] = useState<string>('all');
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const { accountsWithPendencies, summary } = usePendencies(selectedCSM);

    // Filter by pending type
    const filteredAccounts = useMemo(() => {
        if (selectedFilter === 'all') return accountsWithPendencies;
        return accountsWithPendencies.filter(item =>
            item.pendingItems.some(p => p.type === selectedFilter)
        );
    }, [accountsWithPendencies, selectedFilter]);

    // Get icon for pending item type
    const getPendingIcon = (type: PendingItem['type']) => {
        const icons = {
            health_score: ActivityIcon,
            onboarding: Target,
            activity: Clock,
            spiced: FileText,
            overdue: AlertCircle,
            critical_contact: AlertTriangle,
            renewal: Calendar,
            missing_data: Database,
        };
        return icons[type] || AlertCircle;
    };

    // Get color classes for urgency
    const getUrgencyColor = (urgency: 'red' | 'orange' | 'yellow') => {
        const colors = {
            red: {
                border: 'border-l-red-500',
                bg: 'bg-red-50 dark:bg-red-900/10',
                text: 'text-red-700 dark:text-red-300',
                badge: 'bg-red-100 text-red-700 border-red-200',
                icon: 'text-red-600',
            },
            orange: {
                border: 'border-l-orange-500',
                bg: 'bg-orange-50 dark:bg-orange-900/10',
                text: 'text-orange-700 dark:text-orange-300',
                badge: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: 'text-orange-600',
            },
            yellow: {
                border: 'border-l-yellow-500',
                bg: 'bg-yellow-50 dark:bg-yellow-900/10',
                text: 'text-yellow-700 dark:text-yellow-300',
                badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: 'text-yellow-600',
            },
        };
        return colors[urgency];
    };

    // Get health score color
    const getHealthColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-primary" />
                                Pendências
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Central de produtividade para gestão de contas
                            </p>
                            {/* CSM Filter */}
                            <div className="flex items-center gap-3 mt-4">
                                <CSMFilter selectedCSM={selectedCSM} onCSMChange={setSelectedCSM} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Accounts */}
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Total de Contas
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold">{summary.totalAccountsWithPending}</span>
                                        <span className="text-xs text-muted-foreground">com pendências</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Target className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Urgent */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Urgente
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-red-600">{summary.urgentCount}</span>
                                        <span className="text-xs text-muted-foreground">itens</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Due Soon */}
                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Vence em Breve
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-orange-600">{summary.dueSoonCount}</span>
                                        <span className="text-xs text-muted-foreground">itens</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attention Needed */}
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Atenção
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-yellow-600">{summary.attentionCount}</span>
                                        <span className="text-xs text-muted-foreground">itens</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Filtrar por tipo:</span>
                        </div>
                        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
                            <TabsList className="grid grid-cols-3 lg:grid-cols-9 gap-2 h-auto p-1">
                                <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                                <TabsTrigger value="health_score" className="text-xs">Health Score</TabsTrigger>
                                <TabsTrigger value="onboarding" className="text-xs">Onboarding</TabsTrigger>
                                <TabsTrigger value="activity" className="text-xs">Atividade</TabsTrigger>
                                <TabsTrigger value="spiced" className="text-xs">SPICED</TabsTrigger>
                                <TabsTrigger value="overdue" className="text-xs">Atrasados</TabsTrigger>
                                <TabsTrigger value="critical_contact" className="text-xs">Críticos</TabsTrigger>
                                <TabsTrigger value="renewal" className="text-xs">Renovação</TabsTrigger>
                                <TabsTrigger value="missing_data" className="text-xs">Dados</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Accounts List */}
                {filteredAccounts.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Tudo em dia! 🎉</h3>
                            <p className="text-muted-foreground max-w-md">
                                {selectedCSM === 'all'
                                    ? 'Não há pendências no momento. Continue o ótimo trabalho!'
                                    : `${selectedCSM} está em dia com todas as contas!`}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="w-4 h-4" />
                                <span>Produtividade máxima alcançada</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredAccounts.map(({ account, pendingItems, urgencyLevel }) => {
                            const colors = getUrgencyColor(urgencyLevel);

                            return (
                                <Card
                                    key={account.id}
                                    className={`border-l-4 ${colors.border} hover:shadow-lg transition-all duration-200 group`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            {/* Left: Account Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    {/* Health Score Badge */}
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className={`text-2xl font-bold ${getHealthColor(account.healthScore || 0)}`}>
                                                            {account.healthScore || 0}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        {/* Account Name */}
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                                {account.name}
                                                            </h3>
                                                            <Badge variant="outline" className="text-xs">
                                                                {account.type || 'Cliente'}
                                                            </Badge>
                                                        </div>

                                                        {/* CSM & Industry */}
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                                            {account.csm && (
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    <span>{account.csm}</span>
                                                                </div>
                                                            )}
                                                            {account.industry && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{account.industry}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        <Separator className="mb-4" />

                                                        {/* Pending Items List */}
                                                        <div className="space-y-2">
                                                            {pendingItems.map((item, idx) => {
                                                                const Icon = getPendingIcon(item.type);
                                                                const itemColors = getUrgencyColor(item.urgency);

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`flex items-start gap-3 p-3 rounded-lg ${itemColors.bg} border border-transparent hover:border-primary/30 transition-all cursor-pointer`}
                                                                    >
                                                                        <div className={`p-2 rounded-md bg-white dark:bg-gray-900 ${itemColors.icon}`}>
                                                                            <Icon className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-medium text-sm">{item.title}</p>
                                                                                <Badge variant="outline" className={`text-xs ${itemColors.badge}`}>
                                                                                    {item.urgency === 'red' ? 'Urgente' : item.urgency === 'orange' ? 'Em breve' : 'Atenção'}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Action Button */}
                                            <div className="flex lg:flex-col items-center gap-2">
                                                <Badge variant="secondary" className="text-sm font-semibold">
                                                    {pendingItems.length} {pendingItems.length === 1 ? 'pendência' : 'pendências'}
                                                </Badge>
                                                <Link href={`/accounts/${account.id}`}>
                                                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        Ver Conta
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Summary Footer */}
                {filteredAccounts.length > 0 && (
                    <Card className="mt-8 bg-muted/50">
                        <CardContent className="py-4">
                            <p className="text-sm text-center text-muted-foreground">
                                Mostrando <span className="font-semibold text-foreground">{filteredAccounts.length}</span>{' '}
                                {filteredAccounts.length === 1 ? 'conta' : 'contas'} com pendências
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

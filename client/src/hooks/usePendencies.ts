import { useMemo } from 'react';
import { useAccountsContext, Account } from '@/contexts/AccountsContext';
import { useActivitiesContext } from '@/contexts/ActivitiesContext';
import { useTasksContext } from '@/contexts/TasksContext';
import { useOnboarding } from '@/hooks/useOnboarding';

export interface PendingItem {
    type: 'health_score' | 'onboarding' | 'activity' | 'spiced' | 'overdue' | 'critical_contact' | 'renewal' | 'missing_data';
    urgency: 'red' | 'orange' | 'yellow';
    title: string;
    description: string;
    daysOverdue?: number;
    actionUrl?: string;
}

export interface AccountWithPendencies {
    account: Account;
    pendingItems: PendingItem[];
    urgencyLevel: 'red' | 'orange' | 'yellow';
    totalPending: number;
}

export interface PendenciesSummary {
    totalAccountsWithPending: number;
    urgentCount: number;
    dueSoonCount: number;
    attentionCount: number;
}

export function usePendencies(csmFilter?: string) {
    const { accounts } = useAccountsContext();
    const { activities } = useActivitiesContext();
    const { tasks } = useTasksContext();
    const { getProgressStats } = useOnboarding();

    const accountsWithPendencies = useMemo<AccountWithPendencies[]>(() => {
        const now = new Date();
        const results: AccountWithPendencies[] = [];

        // Filter accounts by CSM if specified
        const filteredAccounts = csmFilter && csmFilter !== 'all'
            ? accounts.filter(acc => acc.csm === csmFilter)
            : accounts;

        filteredAccounts.forEach(account => {
            const pendingItems: PendingItem[] = [];

            // 1. Health Score Evaluation (Weekly)
            // Note: We'll need to fetch the last evaluation date from the API
            // For now, checking if healthScore is 0 or hasn't been updated recently
            const healthScoreItem = checkHealthScoreEvaluation(account, now);
            if (healthScoreItem) pendingItems.push(healthScoreItem);

            // 2. Onboarding Completion (2 weeks)
            const onboardingItem = checkOnboardingCompletion(account, now, getProgressStats);
            if (onboardingItem) pendingItems.push(onboardingItem);

            // 3. Regular Activity/Task (Bi-weekly)
            const activityItem = checkRegularActivity(account, now, activities, tasks);
            if (activityItem) pendingItems.push(activityItem);

            // 4. SPICED Framework (SPI Mandatory)
            const spicedItem = checkSPICED(account);
            if (spicedItem) pendingItems.push(spicedItem);

            // 5. Overdue Tasks/Activities
            const overdueItem = checkOverdueTasks(account, now, tasks, activities);
            if (overdueItem) pendingItems.push(overdueItem);

            // 6. Critical Status Weekly Contact
            const criticalContactItem = checkCriticalStatusContact(account, now, activities);
            if (criticalContactItem) pendingItems.push(criticalContactItem);

            // 7. Contract Renewal Approaching
            const renewalItem = checkContractRenewal(account, now);
            if (renewalItem) pendingItems.push(renewalItem);

            // 8. Missing Account Data
            const missingDataItem = checkMissingData(account);
            if (missingDataItem) pendingItems.push(missingDataItem);

            // If this account has pending items, add it to results
            if (pendingItems.length > 0) {
                // Determine overall urgency level (highest urgency wins)
                const urgencyLevel = pendingItems.some(p => p.urgency === 'red')
                    ? 'red'
                    : pendingItems.some(p => p.urgency === 'orange')
                        ? 'orange'
                        : 'yellow';

                results.push({
                    account,
                    pendingItems,
                    urgencyLevel,
                    totalPending: pendingItems.length,
                });
            }
        });

        // Sort by urgency level, then by number of pending items
        return results.sort((a, b) => {
            const urgencyOrder = { red: 0, orange: 1, yellow: 2 };
            const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
            if (urgencyDiff !== 0) return urgencyDiff;
            return b.totalPending - a.totalPending;
        });
    }, [accounts, activities, tasks, csmFilter, getProgressStats]);

    const summary = useMemo<PendenciesSummary>(() => {
        const allPendingItems = accountsWithPendencies.flatMap(a => a.pendingItems);
        return {
            totalAccountsWithPending: accountsWithPendencies.length,
            urgentCount: allPendingItems.filter(p => p.urgency === 'red').length,
            dueSoonCount: allPendingItems.filter(p => p.urgency === 'orange').length,
            attentionCount: allPendingItems.filter(p => p.urgency === 'yellow').length,
        };
    }, [accountsWithPendencies]);

    return {
        accountsWithPendencies,
        summary,
    };
}

// Helper functions for each pending item type

function checkHealthScoreEvaluation(account: Account, now: Date): PendingItem | null {
    // TODO: This needs to fetch the last evaluation date from the API
    // For now, we'll assume accounts need evaluation if they have no recent update
    // In production, this should check: last_evaluation_date < 7 days ago

    // Placeholder logic - this should be replaced with actual API call
    // Handle potential string/number mismatch and snake_case fallback
    const score = account.healthScore ?? (account as any).health_score;
    const numericScore = typeof score === 'string' ? parseInt(score, 10) : score;

    // Check if never evaluated (healthScore === 0) OR default value (75)
    const isDefaultScore = numericScore === 75 || numericScore === 0 || numericScore === undefined || numericScore === null || Number.isNaN(numericScore);

    const lastUpdateDate = account.updatedAt ? new Date(account.updatedAt) : (account.createdAt ? new Date(account.createdAt) : null);
    const daysSinceUpdate = lastUpdateDate ? Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // DEBUG LOG
    // Log ALL accounts to see what's happening with the new one
    console.log(`[HealthScore Check] Account: ${account.name} ${JSON.stringify({
        rawScore: score,
        numericScore,
        isDefaultScore,
        daysSinceUpdate,
        updatedAt: account.updatedAt,
        createdAt: account.createdAt
    })}`);

    // If it has the default score (75 or 0), treat as pending regardless of date
    if (isDefaultScore) {
        return {
            type: 'health_score',
            urgency: 'red',
            title: 'Primeira avaliação necessária',
            description: 'Cliente com Health Score padrão/indefinido',
            actionUrl: `/accounts/${account.id}?tab=health`,
        };
    }

    if (lastUpdateDate && daysSinceUpdate > 7) {
        return {
            type: 'health_score',
            urgency: daysSinceUpdate > 14 ? 'red' : daysSinceUpdate > 10 ? 'orange' : 'yellow',
            title: 'Avaliação de Health Score pendente',
            description: `Última avaliação há ${daysSinceUpdate} dias`,
            daysOverdue: daysSinceUpdate - 7,
            actionUrl: `/accounts/${account.id}?tab=health`,
        };
    }

    return null;
}

function checkOnboardingCompletion(
    account: Account,
    now: Date,
    getProgressStats: (accountId: string) => { percentage: number; completed: number; total: number }
): PendingItem | null {
    if (!account.contractStart) return null;

    const contractStartDate = new Date(account.contractStart);
    const daysSinceStart = Math.floor((now.getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only check if within or past the 2-week window
    if (daysSinceStart >= 0 && daysSinceStart <= 21) {
        const stats = getProgressStats(account.id);

        if (stats.percentage < 100) {
            return {
                type: 'onboarding',
                urgency: daysSinceStart > 14 ? 'red' : daysSinceStart > 10 ? 'orange' : 'yellow',
                title: 'Onboarding incompleto',
                description: `${stats.completed}/${stats.total} itens concluídos (${stats.percentage}%)`,
                daysOverdue: daysSinceStart > 14 ? daysSinceStart - 14 : undefined,
                actionUrl: `/accounts/${account.id}?tab=onboarding`,
            };
        }
    }

    return null;
}

function checkRegularActivity(account: Account, now: Date, activities: any[], tasks: any[]): PendingItem | null {
    const accountActivities = activities.filter(a => a.accountId === account.id);
    const accountTasks = tasks.filter(t => t.accountId === account.id);

    // Find the most recent activity or task
    const allItems = [
        ...accountActivities.map(a => ({ date: a.activity_date || a.createdAt, type: 'activity' })),
        ...accountTasks.map(t => ({ date: t.createdAt, type: 'task' }))
    ];

    if (allItems.length === 0) {
        // No activities or tasks at all - this is critical
        return {
            type: 'activity',
            urgency: 'red',
            title: 'Nenhuma atividade registrada',
            description: 'Conta sem nenhum registro de interação',
            actionUrl: `/accounts/${account.id}?tab=activities`,
        };
    }

    const mostRecentDate = new Date(Math.max(...allItems.map(i => new Date(i.date).getTime())));
    const daysSinceActivity = Math.floor((now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity > 14) {
        return {
            type: 'activity',
            urgency: daysSinceActivity > 20 ? 'red' : daysSinceActivity > 17 ? 'orange' : 'yellow',
            title: 'Sem atividade recente',
            description: `Última interação há ${daysSinceActivity} dias`,
            daysOverdue: daysSinceActivity - 14,
            actionUrl: `/accounts/${account.id}?tab=activities`,
        };
    }

    return null;
}

function checkSPICED(account: Account): PendingItem | null {
    const kickoff = account.internalKickoff;

    if (!kickoff) {
        return {
            type: 'spiced',
            urgency: 'orange',
            title: 'SPICED não preenchido',
            description: 'Informações de kickoff ausentes',
            actionUrl: `/accounts/${account.id}`,
        };
    }

    const missingSPI = [];
    if (!kickoff.customerSituation) missingSPI.push('Situation');
    if (!kickoff.painPoints) missingSPI.push('Pain');
    if (!kickoff.expectedOutcomes) missingSPI.push('Impact');

    if (missingSPI.length > 0) {
        return {
            type: 'spiced',
            urgency: 'orange',
            title: 'SPICED incompleto',
            description: `Faltam: ${missingSPI.join(', ')}`,
            actionUrl: `/accounts/${account.id}`,
        };
    }

    return null;
}

function checkOverdueTasks(account: Account, now: Date, tasks: any[], activities: any[]): PendingItem | null {
    const accountTasks = tasks.filter(t => t.accountId === account.id);
    const accountActivities = activities.filter(a => a.accountId === account.id);

    const overdueTasks = accountTasks.filter(t =>
        t.status !== 'completed' && new Date(t.dueDate) < now
    );

    const overdueActivities = accountActivities.filter(a =>
        a.status !== 'completed' && a.due_date && new Date(a.due_date) < now
    );

    const totalOverdue = overdueTasks.length + overdueActivities.length;

    if (totalOverdue > 0) {
        return {
            type: 'overdue',
            urgency: 'red',
            title: `${totalOverdue} item(ns) atrasado(s)`,
            description: `${overdueTasks.length} tarefas, ${overdueActivities.length} atividades`,
            actionUrl: `/accounts/${account.id}?tab=tasks`,
        };
    }

    return null;
}

function checkCriticalStatusContact(account: Account, now: Date, activities: any[]): PendingItem | null {
    if (account.status !== 'Crítico') return null;

    const accountActivities = activities.filter(a => a.accountId === account.id);

    if (accountActivities.length === 0) {
        return {
            type: 'critical_contact',
            urgency: 'red',
            title: 'Conta crítica sem contato',
            description: 'Status crítico requer contato semanal',
            actionUrl: `/accounts/${account.id}?tab=activities`,
        };
    }

    const mostRecentActivity = new Date(Math.max(...accountActivities.map(a => new Date(a.activity_date || a.createdAt).getTime())));
    const daysSinceContact = Math.floor((now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceContact > 7) {
        return {
            type: 'critical_contact',
            urgency: daysSinceContact > 10 ? 'red' : 'orange',
            title: 'Contato semanal necessário',
            description: `Status crítico - último contato há ${daysSinceContact} dias`,
            daysOverdue: daysSinceContact - 7,
            actionUrl: `/accounts/${account.id}?tab=activities`,
        };
    }

    return null;
}

function checkContractRenewal(account: Account, now: Date): PendingItem | null {
    if (!account.contractEnd) return null;

    const contractEndDate = new Date(account.contractEnd);
    const daysUntilRenewal = Math.floor((contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRenewal > 0 && daysUntilRenewal <= 90) {
        return {
            type: 'renewal',
            urgency: daysUntilRenewal < 30 ? 'red' : daysUntilRenewal < 60 ? 'orange' : 'yellow',
            title: 'Renovação se aproximando',
            description: `Renova em ${daysUntilRenewal} dias`,
            actionUrl: `/accounts/${account.id}`,
        };
    }

    return null;
}

function checkMissingData(account: Account): PendingItem | null {
    const missingFields = [];

    if (!account.website) missingFields.push('Website');
    if (!account.industry) missingFields.push('Indústria');
    if (!account.employees) missingFields.push('Funcionários');

    if (missingFields.length > 0) {
        return {
            type: 'missing_data',
            urgency: 'yellow',
            title: 'Dados incompletos',
            description: `Faltam: ${missingFields.join(', ')}`,
            actionUrl: `/accounts/${account.id}`,
        };
    }

    return null;
}

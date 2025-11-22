import { useMemo } from 'react';
import { useAccountsContext } from '@/contexts/AccountsContext';

export interface CSMetrics {
    // Métricas Financeiras
    mrr: number;
    mrrGrowth: number;
    arr: number;
    arpu: number;
    churnRate: number;
    nrr: number;
    grr: number;

    // Métricas de Saúde
    healthScoreDistribution: {
        champion: number;
        healthy: number;
        attention: number;
        risk: number;
        critical: number;
    };
    accountsAtRisk: number;
    avgHealthScore: number;
    avgTimeToValue: number;
    onboardingCompletionRate: number;

    // Métricas Operacionais
    totalAccounts: number;
    accountsByType: {
        enterprise: number;
        strategic: number;
        smb: number;
        startup: number;
    };
    accountsByCSM: Record<string, number>;

    // Métricas de Pipeline
    pipelineDistribution: Record<string, number>;
    upsellOpportunities: number;
    salvationAccounts: number;
    predictedChurn: number;
}

export function useMetrics(): CSMetrics {
    const { accounts } = useAccountsContext();

    return useMemo(() => {
        // Métricas Financeiras
        const mrr = accounts.reduce((sum, acc) => sum + (acc.mrr || 0), 0);
        const arr = mrr * 12;
        const arpu = accounts.length > 0 ? mrr / accounts.length : 0;

        // Simular crescimento MRR (em produção, comparar com mês anterior)
        const mrrGrowth = 8.5; // Placeholder

        // Churn Rate (accounts com status "Churn" / total)
        const churnedAccounts = accounts.filter(acc => acc.status === 'Churn').length;
        const churnRate = accounts.length > 0 ? (churnedAccounts / accounts.length) * 100 : 0;

        // NRR e GRR (simplificado - em produção, calcular com dados históricos)
        const nrr = 105; // Placeholder (>100% = expansão)
        const grr = 95;  // Placeholder (<100% = contração)

        // Métricas de Saúde
        const healthScoreDistribution = {
            champion: accounts.filter(acc => (acc.healthScore || 0) >= 90).length,
            healthy: accounts.filter(acc => (acc.healthScore || 0) >= 70 && (acc.healthScore || 0) < 90).length,
            attention: accounts.filter(acc => (acc.healthScore || 0) >= 50 && (acc.healthScore || 0) < 70).length,
            risk: accounts.filter(acc => (acc.healthScore || 0) >= 30 && (acc.healthScore || 0) < 50).length,
            critical: accounts.filter(acc => (acc.healthScore || 0) < 30).length,
        };

        const accountsAtRisk = healthScoreDistribution.attention + healthScoreDistribution.risk + healthScoreDistribution.critical;

        const avgHealthScore = accounts.length > 0
            ? accounts.reduce((sum, acc) => sum + (acc.healthScore || 0), 0) / accounts.length
            : 0;

        // Time to Value médio (simplificado)
        const avgTimeToValue = 30; // Placeholder

        // Taxa de conclusão de onboarding (simplificado)
        const onboardingCompletionRate = 75; // Placeholder

        // Métricas Operacionais
        const totalAccounts = accounts.length;

        const accountsByType = {
            enterprise: accounts.filter(acc => acc.type === 'Enterprise').length,
            strategic: accounts.filter(acc => acc.type === 'Strategic').length,
            smb: accounts.filter(acc => acc.type === 'SMB').length,
            startup: accounts.filter(acc => acc.type === 'Startup').length,
        };

        const accountsByCSM: Record<string, number> = {};
        accounts.forEach(acc => {
            const csm = acc.csm || 'Sem CSM';
            accountsByCSM[csm] = (accountsByCSM[csm] || 0) + 1;
        });

        // Métricas de Pipeline
        const pipelineDistribution: Record<string, number> = {};
        accounts.forEach(acc => {
            const status = acc.status || 'Sem Status';
            pipelineDistribution[status] = (pipelineDistribution[status] || 0) + 1;
        });

        const upsellOpportunities = accounts.filter(acc => acc.status === 'Upsell').length;
        const salvationAccounts = accounts.filter(acc => acc.status === 'Salvamento').length;
        const predictedChurn = accounts.filter(acc =>
            acc.status === 'Crítico' || (acc.healthScore || 0) < 30
        ).length;

        return {
            mrr,
            mrrGrowth,
            arr,
            arpu,
            churnRate,
            nrr,
            grr,
            healthScoreDistribution,
            accountsAtRisk,
            avgHealthScore,
            avgTimeToValue,
            onboardingCompletionRate,
            totalAccounts,
            accountsByType,
            accountsByCSM,
            pipelineDistribution,
            upsellOpportunities,
            salvationAccounts,
            predictedChurn,
        };
    }, [accounts]);
}

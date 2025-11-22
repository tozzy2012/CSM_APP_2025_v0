import { useMetrics } from '@/hooks/useMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    AlertTriangle,
    CheckCircle2,
    Target,
    Zap,
    Clock,
    Activity
} from 'lucide-react';

export function ExecutiveDashboard() {
    const metrics = useMetrics();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercentage = (value: number, decimals = 1) => {
        return `${value.toFixed(decimals)}%`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
                <p className="text-muted-foreground">
                    Visão estratégica das métricas de Customer Success
                </p>
            </div>

            {/* Métricas Financeiras */}
            <div>
                <h3 className="text-lg font-semibold mb-4">💰 Métricas Financeiras</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* MRR */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">MRR</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">+{formatPercentage(metrics.mrrGrowth)}</span>
                                <span>vs mês anterior</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* ARR */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ARR</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.arr)}</div>
                            <p className="text-xs text-muted-foreground">
                                Receita Recorrente Anual
                            </p>
                        </CardContent>
                    </Card>

                    {/* ARPU */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.arpu)}</div>
                            <p className="text-xs text-muted-foreground">
                                Receita Média por Account
                            </p>
                        </CardContent>
                    </Card>

                    {/* Churn Rate */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(metrics.churnRate)}</div>
                            <p className="text-xs text-muted-foreground">
                                Taxa de Cancelamento
                            </p>
                        </CardContent>
                    </Card>

                    {/* NRR */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">NRR</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(metrics.nrr, 0)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                {metrics.nrr >= 100 ? (
                                    <>
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-green-600">Expansão líquida positiva</span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                        <span className="text-red-600">Contração líquida</span>
                                    </>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {/* GRR */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">GRR</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(metrics.grr, 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                Retenção Bruta de Receita
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Métricas de Saúde */}
            <div>
                <h3 className="text-lg font-semibold mb-4">❤️ Métricas de Saúde</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Health Score Médio */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Health Score Médio</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.avgHealthScore.toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">
                                {metrics.avgHealthScore >= 70 ? '🟢 Saudável' : metrics.avgHealthScore >= 50 ? '🟡 Atenção' : '🔴 Crítico'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Accounts em Risco */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Accounts em Risco</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{metrics.accountsAtRisk}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatPercentage((metrics.accountsAtRisk / metrics.totalAccounts) * 100)} do total
                            </p>
                        </CardContent>
                    </Card>

                    {/* Time to Value */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Time to Value</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.avgTimeToValue.toFixed(0)} dias</div>
                            <p className="text-xs text-muted-foreground">
                                Tempo médio de onboarding
                            </p>
                        </CardContent>
                    </Card>

                    {/* Taxa de Conclusão */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Onboarding Completo</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(metrics.onboardingCompletionRate)}</div>
                            <p className="text-xs text-muted-foreground">
                                Taxa de conclusão
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Distribuição de Health Scores */}
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Distribuição de Health Scores</CardTitle>
                        <CardDescription>Segmentação dos accounts por nível de saúde</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-sm font-medium">Campeão (90-100)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.healthScoreDistribution.champion} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.healthScoreDistribution.champion / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm font-medium">Saudável (70-89)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.healthScoreDistribution.healthy} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.healthScoreDistribution.healthy / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm font-medium">Atenção (50-69)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.healthScoreDistribution.attention} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.healthScoreDistribution.attention / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-sm font-medium">Risco (30-49)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.healthScoreDistribution.risk} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.healthScoreDistribution.risk / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm font-medium">Crítico (0-29)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.healthScoreDistribution.critical} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.healthScoreDistribution.critical / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Métricas de Pipeline */}
            <div>
                <h3 className="text-lg font-semibold mb-4">📊 Métricas de Pipeline</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total de Accounts */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Accounts</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalAccounts}</div>
                            <p className="text-xs text-muted-foreground">
                                Carteira total
                            </p>
                        </CardContent>
                    </Card>

                    {/* Oportunidades de Upsell */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Oportunidades Upsell</CardTitle>
                            <Zap className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{metrics.upsellOpportunities}</div>
                            <p className="text-xs text-muted-foreground">
                                Potencial de expansão
                            </p>
                        </CardContent>
                    </Card>

                    {/* Accounts em Salvamento */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Em Salvamento</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{metrics.salvationAccounts}</div>
                            <p className="text-xs text-muted-foreground">
                                Requerem atenção imediata
                            </p>
                        </CardContent>
                    </Card>

                    {/* Churn Previsto */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Churn Previsto</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{metrics.predictedChurn}</div>
                            <p className="text-xs text-muted-foreground">
                                Accounts críticos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Distribuição por Tipo */}
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Distribuição por Tipo de Account</CardTitle>
                        <CardDescription>Segmentação da carteira por categoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Enterprise</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.accountsByType.enterprise} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.accountsByType.enterprise / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Strategic</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.accountsByType.strategic} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.accountsByType.strategic / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">SMB</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.accountsByType.smb} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.accountsByType.smb / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Startup</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{metrics.accountsByType.startup} accounts</span>
                                    <span className="text-sm font-medium">{formatPercentage((metrics.accountsByType.startup / metrics.totalAccounts) * 100)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribuição por CSM */}
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Distribuição por CSM</CardTitle>
                        <CardDescription>Carteira de cada Customer Success Manager</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(metrics.accountsByCSM).map(([csm, count]) => (
                                <div key={csm} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{csm}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{count} accounts</span>
                                        <span className="text-sm font-medium">{formatPercentage((count / metrics.totalAccounts) * 100)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

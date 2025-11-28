/**
 * Radar CS Page
 * Intelligence feed showing news about accounts and their industries
 */
import { useState, useEffect, Fragment } from 'react';
import { Link } from 'wouter';
import {
    Newspaper,
    Users,
    Building2,
    TrendingUp,
    Sparkles,
    RefreshCw,
    ChevronRight,
    Calendar,
    Tag,
    BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

import CSMFilter from '@/components/CSMFilter';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    newsType: 'company' | 'industry' | 'market';
    category: string;
    relevanceScore: number;
    publishedDate: string;
    insights: string;
    sourceType: string;
    createdAt: string;
}

interface AccountNews {
    account: {
        id: string;
        name: string;
        industry: string;
        csm: string;
        healthScore: number;
        status: string;
    };
    newsItems: NewsItem[];
    totalNews: number;
}

export default function RadarCS() {
    const [selectedCSM, setSelectedCSM] = useState<string>('all');
    const [selectedMarket, setSelectedMarket] = useState<string>('all');
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [accountsNews, setAccountsNews] = useState<AccountNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch news
    const fetchNews = async (csm?: string) => {
        try {
            setLoading(true);
            const csmParam = csm && csm !== 'all' ? `?csm=${encodeURIComponent(csm)}` : '';
            const response = await fetch(`/api/v1/news${csmParam}`);

            if (!response.ok) throw new Error('Failed to fetch news');

            const data = await response.json();

            // Transform snake_case API response to camelCase for frontend
            const transformedItems = (data.items || []).map((item: any) => ({
                account: {
                    id: item.account.id,
                    name: item.account.name,
                    industry: item.account.industry,
                    csm: item.account.csm,
                    healthScore: item.account.health_score,
                    status: item.account.status,
                },
                newsItems: (item.news_items || []).map((news: any) => ({
                    id: news.id,
                    accountId: news.account_id,
                    title: news.title,
                    summary: news.summary,
                    content: news.content,
                    newsType: news.news_type,
                    category: news.category,
                    sourceType: news.source_type,
                    relevanceScore: news.relevance_score,
                    publishedDate: news.published_date,
                    insights: news.insights,
                    createdAt: news.created_at,
                })),
                totalNews: item.total_news,
            }));

            setAccountsNews(transformedItems);
        } catch (error) {
            console.error('Error fetching news:', error);
            toast.error('Erro ao carregar notícias');
        } finally {
            setLoading(false);
        }
    };

    // Refresh news for specific account
    const refreshAccountNews = async (accountId: string) => {
        try {
            setRefreshing(true);
            const response = await fetch(`/api/v1/news/refresh/${accountId}?force=true`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
                throw new Error(errorData.detail || 'Failed to refresh news');
            }

            const result = await response.json();
            toast.success(`${result.news_count} notícias encontradas!`);
            await fetchNews(selectedCSM);
        } catch (error: any) {
            console.error('Error refreshing news:', error);
            toast.error(error.message || 'Erro ao atualizar notícias. Verifique se a chave OpenAI está configurada em Settings > AI.');
        } finally {
            setRefreshing(false);
        }
    };

    // Refresh news for all visible accounts
    const refreshAllNews = async () => {
        if (accountsNews.length === 0) {
            toast.error('Nenhum account disponível para atualizar');
            return;
        }

        try {
            setRefreshing(true);
            let totalNewsFound = 0;
            let successCount = 0;
            let errorCount = 0;

            toast.info(`Buscando notícias para ${accountsNews.length} accounts...`);

            // Refresh each account sequentially to avoid overloading the API
            for (const { account } of accountsNews) {
                try {
                    const response = await fetch(`/api/v1/news/refresh/${account.id}?force=true`, {
                        method: 'POST',
                    });

                    if (response.ok) {
                        const result = await response.json();
                        totalNewsFound += result.news_count || 0;
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error refreshing account ${account.name}:`, error);
                    errorCount++;
                }
            }

            // Show results
            if (successCount > 0) {
                toast.success(`✅ ${totalNewsFound} notícias encontradas para ${successCount} accounts!`);
            }
            if (errorCount > 0) {
                toast.warning(`⚠️ ${errorCount} accounts falharam ao atualizar`);
            }

            // Reload the news list
            await fetchNews(selectedCSM);
        } catch (error: any) {
            console.error('Error refreshing all news:', error);
            toast.error('Erro ao atualizar notícias');
        } finally {
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchNews(selectedCSM);
    }, [selectedCSM]);

    // Get icon for news type
    const getNewsTypeIcon = (type: string) => {
        switch (type) {
            case 'company':
                return Building2;
            case 'industry':
                return TrendingUp;
            case 'market':
                return BarChart3;
            default:
                return Newspaper;
        }
    };

    // Get color for news type
    const getNewsTypeColor = (type: string) => {
        switch (type) {
            case 'company':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'industry':
                return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
            case 'market':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    // Get badge color for category
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            financeiro: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            negocios: 'bg-blue-100 text-blue-700 border-blue-200',
            tecnologia: 'bg-violet-100 text-violet-700 border-violet-200',
            regulatorio: 'bg-orange-100 text-orange-700 border-orange-200',
            pessoas: 'bg-pink-100 text-pink-700 border-pink-200',
        };
        return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
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
                                <Newspaper className="w-8 h-8 text-primary" />
                                Radar CS
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Intelligence feed de notícias sobre seus accounts
                            </p>
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-6 mt-4">
                                {/* CSM Filter */}
                                <CSMFilter selectedCSM={selectedCSM} onCSMChange={setSelectedCSM} />

                                {/* Market Filter */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted-foreground">Mercado:</label>
                                    <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="company">Empresa</SelectItem>
                                            <SelectItem value="industry">Indústria</SelectItem>
                                            <SelectItem value="market">Mercado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Account Filter */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted-foreground">Account:</label>
                                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {accountsNews.map(({ account }: any) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Global Reload Button */}
                            <div className="mt-4">
                                <Button
                                    onClick={refreshAllNews}
                                    disabled={loading || refreshing}
                                    variant="default"
                                    size="sm"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    {refreshing ? 'Atualizando...' : 'Recarregar Notícias'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Total de Accounts
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold">{accountsNews.length}</span>
                                        <span className="text-xs text-muted-foreground">com notícias</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Total de Notícias
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-blue-600">
                                            {accountsNews.reduce((acc: number, item: any) => acc + item.totalNews, 0)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">itens</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <Newspaper className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Média Relevância
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-purple-600">
                                            {Math.round(
                                                accountsNews.reduce((acc: number, account: any) => {
                                                    if (!account.newsItems || account.newsItems.length === 0) return acc;
                                                    const avgScore = account.newsItems.reduce((sum: number, news: any) => sum + news.relevanceScore, 0) / account.newsItems.length;
                                                    return acc + avgScore;
                                                }, 0) / (accountsNews.filter((a: any) => a.newsItems && a.newsItems.length > 0).length || 1)
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">/100</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                                    <Sparkles className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        CSMs Ativos
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold text-green-600">
                                            {selectedCSM === 'all'
                                                ? new Set(accountsNews.map((a: any) => a.account.csm)).size
                                                : 1
                                            }
                                        </span>
                                        <span className="text-xs text-muted-foreground">CSMs</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* News List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-8 w-64 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : accountsNews.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Newspaper className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Nenhuma notícia encontrada</h3>
                            <p className="text-muted-foreground max-w-md">
                                {selectedCSM === 'all'
                                    ? 'Não há notícias disponíveis no momento. Configure a API Key do OpenAI nas configurações.'
                                    : `Não há notícias para ${selectedCSM} no momento.`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {accountsNews.map(({ account, newsItems }: any) => {
                            return (
                                <Card key={account.id} className="hover:shadow-lg transition-all duration-200">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Health Score */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`text-2xl font-bold ${getHealthColor(account.healthScore || 0)}`}>
                                                        {account.healthScore || 0}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                                                </div>

                                                <div className="flex-1">
                                                    {/* Account Name */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-semibold">{account.name}</h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {newsItems?.length || 0} notícias
                                                        </Badge>
                                                    </div>

                                                    {/* Account Meta */}
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        {account.csm && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                <span>{account.csm}</span>
                                                            </div>
                                                        )}
                                                        {account.industry && (
                                                            <Fragment>
                                                                <span>•</span>
                                                                <span>{account.industry}</span>
                                                            </Fragment>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => refreshAccountNews(account.id)}
                                                    disabled={refreshing}
                                                >
                                                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                                    Atualizar
                                                </Button>
                                                <Link href={`/accounts/${account.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        Ver Account
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6">
                                        {newsItems && newsItems.length > 0 ? (
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="news" className="border-0">
                                                    <AccordionTrigger className="hover:no-underline py-2">
                                                        <div className="flex items-center gap-2">
                                                            <Newspaper className="w-4 h-4 text-primary" />
                                                            <span className="font-semibold">Ver {newsItems.length} notícia{newsItems.length > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-4 pt-4">
                                                            {newsItems.map((news: any) => {
                                                                const TypeIcon = getNewsTypeIcon(news.newsType);
                                                                return (
                                                                    <div
                                                                        key={news.id}
                                                                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                                    >
                                                                        {/* News Header */}
                                                                        <div className="flex items-start gap-3 mb-3">
                                                                            <div className={`p-2 rounded-md ${getNewsTypeColor(news.newsType)}`}>
                                                                                <TypeIcon className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                                                    <h4 className="font-semibold text-base leading-tight">
                                                                                        {news.title}
                                                                                    </h4>
                                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                                        <Badge variant="outline" className={getCategoryColor(news.category)}>
                                                                                            {news.category}
                                                                                        </Badge>
                                                                                        <Badge variant="secondary" className="text-xs">
                                                                                            {news.relevanceScore}/100
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                                    {news.summary}
                                                                                </p>

                                                                                {/* Insights */}
                                                                                {news.insights && (
                                                                                    <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                                                                                        <div className="flex items-start gap-2">
                                                                                            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                                                            <div>
                                                                                                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                                                                                                    Insights para CS
                                                                                                </p>
                                                                                                <p className="text-sm">{news.insights}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* News Footer */}
                                                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                                    {news.publishedDate && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Calendar className="w-3 h-3" />
                                                                                            <span>
                                                                                                {new Date(news.publishedDate).toLocaleDateString('pt-BR')}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    <span>•</span>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Tag className="w-3 h-3" />
                                                                                        <span className="capitalize">{news.newsType}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Nenhuma notícia disponível
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div >
    );
}

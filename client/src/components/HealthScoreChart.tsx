/**
 * Health Score Chart Component
 * Displays a line chart showing the health score history over time
 */
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface HealthScoreHistoryItem {
    id: string;
    accountId: string;
    evaluatedBy: string;
    evaluationDate: string;
    totalScore: number;
    classification: string;
    pilarScores?: Record<string, number>;
    createdAt: string;
}

interface HealthScoreChartProps {
    accountId: string;
}

export default function HealthScoreChart({ accountId }: HealthScoreChartProps) {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<HealthScoreHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [accountId]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/v1/accounts/${accountId}/health-scores?limit=30`);
            // Reverse para mostrar do mais antigo ao mais recente
            setHistory(response.data.reverse());
        } catch (err: any) {
            console.error("Error loading health score history:", err);
            const errorMsg = "Erro ao carregar histórico de Health Score";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getClassificationColor = (classification: string): string => {
        switch (classification.toLowerCase()) {
            case "champion":
                return "#10b981"; // green-500
            case "healthy":
                return "#84cc16"; // lime-500
            case "attention":
                return "#eab308"; // yellow-500
            case "at-risk":
                return "#f97316"; // orange-500
            case "critical":
                return "#ef4444"; // red-500
            default:
                return "#6b7280"; // gray-500
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        });
    };

    const calculateTrend = (): "up" | "down" | "stable" | null => {
        if (history.length < 2) return null;

        const latest = history[history.length - 1].totalScore;
        const previous = history[history.length - 2].totalScore;

        if (latest > previous + 5) return "up";
        if (latest < previous - 5) return "down";
        return "stable";
    };

    const chartData = history.map((item) => ({
        date: formatDate(item.evaluationDate),
        score: item.totalScore,
        classification: item.classification,
        fullDate: new Date(item.evaluationDate).toLocaleDateString("pt-BR"),
    }));

    const trend = calculateTrend();

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8 text-red-600">
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Nenhum histórico de avaliação disponível ainda.</p>
                        <p className="text-sm mt-2">Complete uma avaliação de Health Score para ver o gráfico.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Histórico de Health Score</CardTitle>
                    {trend && (
                        <div className="flex items-center gap-2 text-sm">
                            {trend === "up" && (
                                <>
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">Melhorando</span>
                                </>
                            )}
                            {trend === "down" && (
                                <>
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    <span className="text-red-600 font-medium">Em declínio</span>
                                </>
                            )}
                            {trend === "stable" && (
                                <>
                                    <Minus className="w-4 h-4 text-gray-600" />
                                    <span className="text-gray-600 font-medium">Estável</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                domain={[0, 100]}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                ticks={[0, 25, 50, 75, 100]}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                <p className="text-sm font-semibold">{data.fullDate}</p>
                                                <p className="text-2xl font-bold text-purple-600 mt-1">
                                                    {data.score}
                                                </p>
                                                <p className="text-xs text-gray-600 capitalize mt-1">
                                                    {data.classification}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fill="url(#scoreGradient)"
                                dot={{
                                    fill: "#8b5cf6",
                                    r: 4,
                                    strokeWidth: 2,
                                    stroke: "#fff",
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#7c3aed",
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Ranges Legend */}
                <div className="mt-6 grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Champion (90+)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                        <span>Healthy (70-89)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Atenção (50-69)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>At-Risk (30-49)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical (\u003c30)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

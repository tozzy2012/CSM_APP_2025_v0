/**
 * Question Responses Evolution Chart - Pilar View
 * Displays 5 lines showing the evolution of each pilar's average score over time
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
    Legend,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface HealthScoreHistoryItem {
    id: string;
    accountId: string;
    evaluatedBy: string;
    evaluationDate: string;
    totalScore: number;
    classification: string;
    responses: Record<string, number>;
    pilarScores?: Record<string, number>;
    createdAt: string;
}

interface QuestionResponsesChartProps {
    accountId: string;
}

// Cores por pilar
const PILAR_COLORS: Record<string, string> = {
    "Adoção e Engajamento": "#3b82f6", // blue-500
    "Percepção de Valor": "#10b981", // green-500
    "Relacionamento e Satisfação": "#8b5cf6", // purple-500
    "Saúde Operacional": "#f97316", // orange-500
    "Potencial de Crescimento": "#ec4899", // pink-500
};

// Mapeamento de perguntas para pilares
const QUESTION_TO_PILAR: Record<number, string> = {
    1: "Adoção e Engajamento",
    2: "Adoção e Engajamento",
    3: "Percepção de Valor",
    4: "Percepção de Valor",
    5: "Relacionamento e Satisfação",
    6: "Relacionamento e Satisfação",
    7: "Saúde Operacional",
    8: "Saúde Operacional",
    9: "Potencial de Crescimento",
    10: "Potencial de Crescimento",
};

const PILAR_NAMES = [
    "Adoção e Engajamento",
    "Percepção de Valor",
    "Relacionamento e Satisfação",
    "Saúde Operacional",
    "Potencial de Crescimento",
];

export default function QuestionResponsesChart({ accountId }: QuestionResponsesChartProps) {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<HealthScoreHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hiddenPilars, setHiddenPilars] = useState<Set<string>>(new Set());

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
            const errorMsg = "Erro ao carregar histórico de respostas";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        });
    };

    const togglePilar = (pilarName: string) => {
        setHiddenPilars(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pilarName)) {
                newSet.delete(pilarName);
            } else {
                newSet.add(pilarName);
            }
            return newSet;
        });
    };

    // Calcular médias por pilar para cada avaliação
    const chartData = history.map((item) => {
        const dataPoint: any = {
            date: formatDate(item.evaluationDate),
            fullDate: new Date(item.evaluationDate).toLocaleDateString("pt-BR"),
        };

        // Calcular média de cada pilar
        const pilarScores: Record<string, number[]> = {};

        Object.entries(item.responses).forEach(([questionId, score]) => {
            const pilarName = QUESTION_TO_PILAR[parseInt(questionId)];
            if (pilarName) {
                if (!pilarScores[pilarName]) {
                    pilarScores[pilarName] = [];
                }
                pilarScores[pilarName].push(score);
            }
        });

        // Calcular médias
        Object.entries(pilarScores).forEach(([pilarName, scores]) => {
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            dataPoint[pilarName] = Math.round(average);
        });

        return dataPoint;
    });

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Carregando evolução por pilar...</span>
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
                        <p className="text-sm mt-2">Complete uma avaliação de Health Score para ver a evolução.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Evolução por Pilar</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Acompanhe a evolução de cada pilar ao longo do tempo
                        </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
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
                                    if (active && payload && payload.length > 0) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                                <p className="text-sm font-semibold mb-3">{data.fullDate}</p>
                                                <div className="space-y-2">
                                                    {payload.map((entry: any, index: number) => {
                                                        if (entry.dataKey === 'date' || entry.dataKey === 'fullDate') return null;

                                                        return (
                                                            <div key={index} className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: entry.color }}
                                                                    ></div>
                                                                    <span className="text-sm font-medium">{entry.dataKey}</span>
                                                                </div>
                                                                <span className="text-sm font-bold" style={{ color: entry.color }}>
                                                                    {entry.value}/100
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                content={({ payload }) => (
                                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                        {payload?.map((entry: any, index: number) => {
                                            if (entry.dataKey === 'date' || entry.dataKey === 'fullDate') return null;

                                            const pilarName = entry.dataKey;
                                            const isHidden = hiddenPilars.has(pilarName);

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => togglePilar(pilarName)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isHidden
                                                            ? 'bg-gray-100 text-gray-400 opacity-50'
                                                            : 'bg-gray-50 hover:bg-gray-100 border-2'
                                                        }`}
                                                    style={!isHidden ? { borderColor: entry.color } : {}}
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: isHidden ? '#d1d5db' : entry.color }}
                                                    ></div>
                                                    <span>{pilarName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            />

                            {/* Renderizar uma linha para cada pilar */}
                            {PILAR_NAMES.map((pilarName) => (
                                <Line
                                    key={pilarName}
                                    type="monotone"
                                    dataKey={pilarName}
                                    stroke={PILAR_COLORS[pilarName]}
                                    strokeWidth={3}
                                    dot={{ fill: PILAR_COLORS[pilarName], r: 4, strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6 }}
                                    hide={hiddenPilars.has(pilarName)}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Info sobre o cálculo */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                        <strong>💡 Como funciona:</strong> Cada linha representa a <strong>média</strong> das 2 perguntas do pilar.
                        Por exemplo, "Adoção e Engajamento" é a média das perguntas 1 e 2.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Account Insights Component
 * Displays AI-powered intelligence and analysis for an account
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    Sparkles,
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowUp,
    Target,
    Lightbulb,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface AccountInsightsProps {
    accountId: string;
}

interface RiskItem {
    type: string;
    severity: string;
    description: string;
}

interface OpportunityItem {
    type: string;
    description: string;
    confidence: string;
    estimated_value?: number;
}

interface AIAnalysis {
    summary: string;
    health_assessment: {
        overall_health: string;
        key_strengths: string[];
        key_concerns: string[];
    };
    churn_risk: {
        score: number;
        level: string;
        primary_factors: Array<{
            factor: string;
            impact: string;
            description: string;
        }>;
    };
    expansion_opportunities: Array<{
        type: string;
        description: string;
        estimated_value?: number;
        confidence: string;
        next_steps?: string[];
    }>;
    next_best_actions: Array<{
        action: string;
        rationale: string;
        timeline: string;
        expected_outcome: string;
    }>;
    strategic_insights: string[];
}

interface IntelligenceData {
    risks: RiskItem[];
    opportunities: OpportunityItem[];
    tasks: {
        open: number;
        overdue: number;
        completion_rate_30d: number;
    };
    activities: {
        total_30d: number;
        days_since_last_interaction: number | null;
    };
    health: {
        current_score: number;
    };
}

export default function AccountInsights({ accountId }: AccountInsightsProps) {
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false); // Accordion state - starts closed

    const loadIntelligence = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/v1/accounts/${accountId}/intelligence`);
            setIntelligence(response.data);
        } catch (err: any) {
            console.error("Error loading intelligence:", err);
            setError("Erro ao carregar dados de inteligência");
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const analyzeWithAI = async () => {
        setAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post(`/api/v1/accounts/${accountId}/analyze`);
            setAiAnalysis(response.data.ai_analysis);
            setIntelligence(response.data.context);
            toast.success("Análise de IA concluída!");
        } catch (err: any) {
            console.error("Error analyzing with AI:", err);
            const errorMsg = err.response?.data?.detail || "Erro ao analisar com IA";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setAnalyzing(false);
        }
    };

    // Auto-load intelligence on mount
    useState(() => {
        loadIntelligence();
    });

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high":
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-blue-100 text-blue-800 border-blue-200";
        }
    };

    const getChurnRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
            case "critical":
            case "high":
                return "text-red-600 bg-red-50";
            case "medium":
                return "text-yellow-600 bg-yellow-50";
            default:
                return "text-green-600 bg-green-50";
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Carregando insights...</span>
                </div>
            </Card>
        );
    }

    if (error && !intelligence) {
        return (
            <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 text-red-800">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
                <Button onClick={loadIntelligence} className="mt-4" variant="outline">
                    Tentar Novamente
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            {intelligence && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-purple-600">
                            {intelligence.health.current_score}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Health Score</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">
                            {intelligence.activities.total_30d}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Atividades (30d)</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-orange-600">
                            {intelligence.tasks.overdue}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Tasks Atrasadas</div>
                    </div>
                </div>
            )}



            {/* Risks */}
            {intelligence && intelligence.risks.length > 0 && (
                <>
                    <Separator />
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-red-900">Sinais de Risco</h4>
                        </div>
                        <div className="space-y-2">
                            {intelligence.risks.slice(0, 3).map((risk, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {risk.severity.toUpperCase()}
                                        </Badge>
                                        <p className="text-sm flex-1">{risk.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Opportunities */}
            {intelligence && intelligence.opportunities.length > 0 && (
                <>
                    <Separator />
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-900">Oportunidades</h4>
                        </div>
                        <div className="space-y-2">
                            {intelligence.opportunities.map((opp, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-lg border bg-green-50 border-green-200"
                                >
                                    <div className="flex items-start gap-2">
                                        <Badge variant="outline" className="text-xs bg-white">
                                            {opp.confidence.toUpperCase()}
                                        </Badge>
                                        <p className="text-sm text-green-900 flex-1">{opp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* AI Analysis Results */}
            {aiAnalysis && (
                <>
                    <Separator className="my-6" />
                    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-blue-900">Análise de IA</h3>
                        </div>

                        {/* Summary */}
                        <div>
                            <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
                        </div>

                        <Separator />

                        {/* Churn Risk */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-5 h-5 text-red-600" />
                                <h4 className="font-semibold">Risco de Churn</h4>
                            </div>
                            <div className={`p-4 rounded-lg ${getChurnRiskColor(aiAnalysis.churn_risk.level)}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium">Nível de Risco</span>
                                    <Badge className="text-xs">
                                        {aiAnalysis.churn_risk.level.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl font-bold">{aiAnalysis.churn_risk.score}</div>
                                    <div className="text-sm">/ 100</div>
                                </div>
                                {aiAnalysis.churn_risk.primary_factors && aiAnalysis.churn_risk.primary_factors.length > 0 && (
                                    <div className="mt-4 space-y-1">
                                        <p className="text-xs font-medium mb-2">Principais Fatores:</p>
                                        {aiAnalysis.churn_risk.primary_factors.slice(0, 3).map((factor, idx) => (
                                            <div key={idx} className="text-xs opacity-90">
                                                • {factor.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Next Best Actions */}
                        {aiAnalysis.next_best_actions && aiAnalysis.next_best_actions.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ArrowUp className="w-5 h-5 text-purple-600" />
                                        <h4 className="font-semibold">Próximas Ações</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {aiAnalysis.next_best_actions.slice(0, 3).map((action, idx) => (
                                            <div key={idx} className="p-3 bg-white rounded-lg border">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{action.action}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {action.rationale}
                                                        </p>
                                                        <Badge variant="outline" className="text-xs mt-2">
                                                            {action.timeline}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Strategic Insights */}
                        {aiAnalysis.strategic_insights && aiAnalysis.strategic_insights.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                                        <h4 className="font-semibold">Insights Estratégicos</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {aiAnalysis.strategic_insights.map((insight, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-yellow-600 mt-1">💡</span>
                                                <span>{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* AI Analysis Button */}
            {!aiAnalysis && intelligence && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 blur-xl" />
                    <Button
                        onClick={analyzeWithAI}
                        disabled={analyzing}
                        className="relative w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold"
                        size="lg"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Analisando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 mr-3" />
                                Analisar com Inteligência Artificial
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

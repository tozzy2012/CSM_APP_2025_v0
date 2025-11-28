import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bot, Save, Loader2, Edit2, Check, X, Sparkles, Brain, Zap } from "lucide-react";
import { getDefaultTenant, updateTenant, Tenant } from "@/api";
import { cn } from "@/lib/utils";

const SENIOR_CSM_PROMPT = `Você é um Customer Success Manager Sênior com vasta experiência em retenção de clientes B2B e expansão de receita (Upsell/Cross-sell).

Sua análise deve ser:
1. Estratégica: Focada nos objetivos de negócio do cliente.
2. Baseada em Dados: Utilize as métricas fornecidas para justificar conclusões.
3. Orientada para Ação: Sugira próximos passos claros e playbooks específicos.

Ao analisar contas, identifique proativamente:
- Riscos de Churn (sinais de alerta)
- Oportunidades de Expansão (novos casos de uso)
- Saúde do Relacionamento (engajamento com stakeholders)

Mantenha um tom profissional, consultivo e direto.`;

const ANALYSIS_STYLES = [
    {
        id: "precise",
        label: "Analítico & Preciso",
        description: "Foca estritamente nos dados e fatos. Menor alucinação.",
        value: 0.2,
        icon: Zap
    },
    {
        id: "balanced",
        label: "Equilibrado",
        description: "Equilíbrio ideal entre dados e insights qualitativos.",
        value: 0.5,
        icon: Brain
    },
    {
        id: "creative",
        label: "Estratégico & Criativo",
        description: "Gera ideias inovadoras e conexões menos óbvias.",
        value: 0.8,
        icon: Sparkles
    }
];

export default function AISettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Form states
    const [apiKey, setApiKey] = useState("");
    const [perplexityApiKey, setPerplexityApiKey] = useState("");
    const [systemPrompt, setSystemPrompt] = useState(SENIOR_CSM_PROMPT);
    const [creativityLevel, setCreativityLevel] = useState(0.5);

    // UI states
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getDefaultTenant();
            setTenant(data);

            if (data.settings?.ai) {
                setApiKey(data.settings.ai.openaiApiKey || "");
                setPerplexityApiKey(data.settings.ai.perplexityApiKey || "");
                // Ensure we use the default prompt if the saved one is empty or null
                const savedPrompt = data.settings.ai.systemPrompt;
                setSystemPrompt(savedPrompt && savedPrompt.trim().length > 0 ? savedPrompt : SENIOR_CSM_PROMPT);
                setCreativityLevel(data.settings.ai.creativityLevel ?? 0.5);
            } else {
                setSystemPrompt(SENIOR_CSM_PROMPT);
            }
        } catch (error) {
            console.error("Error loading AI settings:", error);
            toast.error("Erro ao carregar configurações de IA");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tenant) return;

        try {
            setSaving(true);

            const updatedSettings = {
                ...tenant.settings,
                ai: {
                    openaiApiKey: apiKey,
                    perplexityApiKey: perplexityApiKey,
                    systemPrompt,
                    creativityLevel
                }
            };

            await updateTenant(tenant.tenant_id, {
                settings: updatedSettings
            });

            toast.success("Configurações de IA salvas com sucesso!");
            setIsEditingPrompt(false);
        } catch (error) {
            console.error("Error saving AI settings:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setSaving(false);
        }
    };

    const handleResetPrompt = () => {
        setSystemPrompt(SENIOR_CSM_PROMPT);
        toast.info("Prompt restaurado para o padrão Senior CSM");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" />
                        Inteligência Artificial
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Configure o "cérebro" da sua operação de Customer Success
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6">
                {/* API Keys Configuration */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Conexão</h3>
                    <div className="grid gap-6">
                        {/* OpenAI API Key */}
                        <div className="grid gap-2">
                            <Label htmlFor="apiKey">OpenAI API Key</Label>
                            <div className="relative">
                                <Input
                                    id="apiKey"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                                    {apiKey ? <Check className="w-4 h-4 text-green-500" /> : "Obrigatório"}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Usada para análises de contas e geração de insights.
                            </p>
                        </div>

                        <Separator />

                        {/* Perplexity API Key */}
                        <div className="grid gap-2">
                            <Label htmlFor="perplexityApiKey">
                                Perplexity API Key
                                <span className="ml-2 text-xs font-normal text-muted-foreground">(Opcional)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="perplexityApiKey"
                                    type="password"
                                    value={perplexityApiKey}
                                    onChange={(e) => setPerplexityApiKey(e.target.value)}
                                    placeholder="pplx-..."
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                                    {perplexityApiKey && <Check className="w-4 h-4 text-green-500" />}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Usada para buscar <strong>notícias reais em tempo real</strong> no Radar CS. Se não configurada, usará OpenAI.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* System Prompt Configuration */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Personalidade da IA</h3>
                            <p className="text-sm text-muted-foreground">
                                Defina como a IA deve se comportar e analisar seus dados
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {isEditingPrompt ? (
                                <>
                                    <Button variant="ghost" size="sm" onClick={handleResetPrompt}>
                                        Restaurar Padrão
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => setIsEditingPrompt(false)}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-2" />
                                        )}
                                        Salvar & Concluir
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditingPrompt(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar Prompt
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={cn(
                        "relative rounded-md border bg-muted/50 p-4 transition-all",
                        isEditingPrompt ? "ring-2 ring-primary bg-background" : ""
                    )}>
                        {isEditingPrompt ? (
                            <Textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="min-h-[300px] border-0 focus-visible:ring-0 bg-transparent resize-none font-mono text-sm leading-relaxed"
                                placeholder="Digite o prompt do sistema..."
                            />
                        ) : (
                            <div className="min-h-[150px] whitespace-pre-wrap font-mono text-sm text-muted-foreground leading-relaxed">
                                {systemPrompt || "Nenhum prompt definido."}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Analysis Style (Temperature) */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Estilo de Análise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ANALYSIS_STYLES.map((style) => {
                            const Icon = style.icon;
                            const isSelected = creativityLevel === style.value;

                            return (
                                <div
                                    key={style.id}
                                    onClick={() => setCreativityLevel(style.value)}
                                    className={cn(
                                        "cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50",
                                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-sm">{style.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {style.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}

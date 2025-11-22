/**
 * HealthScoreSettings Component
 * Configuração de perguntas e pesos do Health Score
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { HelpCircle, RotateCcw } from "lucide-react";

// Perguntas padrão com pesos (10 perguntas do Manus)
const DEFAULT_QUESTIONS = [
  { id: 1, text: "Frequência de uso do produto (últimos 7 dias)", category: "Adoção", weight: 10 },
  { id: 2, text: "Nível de adoção de funcionalidades principais", category: "Adoção", weight: 15 },
  { id: 3, text: "Percepção de valor entregue pelo produto", category: "Valor", weight: 15 },
  { id: 4, text: "ROI percebido pelo cliente", category: "Valor", weight: 15 },
  { id: 5, text: "Qualidade do relacionamento com CSM", category: "Relacionamento", weight: 10 },
  { id: 6, text: "Engajamento em reuniões e check-ins", category: "Relacionamento", weight: 10 },
  { id: 7, text: "Número de tickets de suporte abertos", category: "Operacional", weight: 8 },
  { id: 8, text: "Tempo médio de resolução de problemas", category: "Operacional", weight: 7 },
  { id: 9, text: "Potencial de expansão (upsell/cross-sell)", category: "Crescimento", weight: 5 },
  { id: 10, text: "Indicação de NPS (Net Promoter Score)", category: "Crescimento", weight: 5 },
];

// Perfis pré-configurados
const PROFILES = {
  balanced: {
    name: "Balanceado",
    description: "Peso equilibrado entre todas as categorias",
    weights: [10, 15, 15, 15, 10, 10, 8, 7, 5, 5],
  },
  relationship: {
    name: "Foco em Relacionamento",
    description: "Prioriza qualidade do relacionamento e engajamento",
    weights: [8, 10, 12, 12, 20, 18, 6, 5, 5, 4],
  },
  product: {
    name: "Foco em Produto",
    description: "Prioriza adoção e uso do produto",
    weights: [20, 20, 15, 10, 8, 8, 7, 6, 3, 3],
  },
  financial: {
    name: "Foco Financeiro",
    description: "Prioriza ROI e potencial de expansão",
    weights: [8, 10, 18, 18, 8, 8, 5, 5, 10, 10],
  },
  operational: {
    name: "Foco Operacional",
    description: "Prioriza suporte e resolução de problemas",
    weights: [10, 12, 12, 12, 8, 8, 15, 13, 5, 5],
  },
};

export default function HealthScoreSettings() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [selectedProfile, setSelectedProfile] = useState<string>("balanced");
  const [showExplanation, setShowExplanation] = useState(false);

  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  const handleWeightChange = (id: number, newWeight: number) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, weight: newWeight } : q
    ));
  };

  const handleApplyProfile = (profileKey: string) => {
    const profile = PROFILES[profileKey as keyof typeof PROFILES];
    if (profile) {
      setQuestions(questions.map((q, index) => ({
        ...q,
        weight: profile.weights[index],
      })));
      setSelectedProfile(profileKey);
      toast.success(`Perfil "${profile.name}" aplicado!`);
    }
  };

  const handleReset = () => {
    setQuestions(DEFAULT_QUESTIONS);
    setSelectedProfile("balanced");
    toast.success("Configurações restauradas para o padrão!");
  };

  const handleSave = () => {
    // Salvar no localStorage
    localStorage.setItem("healthScoreQuestions", JSON.stringify(questions));
    toast.success("Configurações de Health Score salvas!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => setShowExplanation(true)}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Como funciona?
        </Button>
        <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Como funciona o cálculo do Health Score?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O Health Score é calculado com base nas respostas do questionário semanal preenchido pelo CS.
                Cada pergunta tem um peso que determina sua importância no cálculo final.
              </p>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Fórmula de Cálculo:</h4>
                <code className="text-sm">
                  Health Score = Σ (Resposta × Peso) / Σ Pesos
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Onde: Resposta varia de 0 a 100 para cada pergunta
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Exemplo Prático:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Pergunta 1 (peso 10): Resposta 80 → Contribuição: 800 pontos</li>
                  <li>• Pergunta 2 (peso 15): Resposta 60 → Contribuição: 900 pontos</li>
                  <li>• ... (todas as 10 perguntas)</li>
                  <li>• <strong>Total: 7500 pontos / 100 pesos = 75/100 (Health Score)</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Classificação:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <span className="text-green-600 font-semibold">90-100:</span> Campeão</li>
                  <li>• <span className="text-green-600 font-semibold">70-89:</span> Saudável</li>
                  <li>• <span className="text-yellow-600 font-semibold">50-69:</span> Atenção</li>
                  <li>• <span className="text-red-600 font-semibold">30-49:</span> Em Risco</li>
                  <li>• <span className="text-red-600 font-semibold">0-29:</span> Crítico</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Perfis Pré-configurados */}
      <div className="mb-6">
        <Label className="mb-2 block">Perfis Pré-configurados</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(PROFILES).map(([key, profile]) => (
            <Button
              key={key}
              variant={selectedProfile === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleApplyProfile(key)}
              className="text-xs"
            >
              {profile.name}
            </Button>
          ))}
        </div>
        {selectedProfile && (
          <p className="text-xs text-muted-foreground mt-2">
            {PROFILES[selectedProfile as keyof typeof PROFILES].description}
          </p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Lista de Perguntas com Sliders */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Perguntas e Pesos</h3>
          <span className="text-sm text-muted-foreground">
            Total: {totalWeight}/100 pontos
          </span>
        </div>

        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm">{question.id}. {question.text}</Label>
                <p className="text-xs text-muted-foreground">{question.category}</p>
              </div>
              <span className="text-sm font-semibold ml-4 min-w-[60px] text-right">
                Peso: {question.weight}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={question.weight}
              onChange={(e) => handleWeightChange(question.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Ações */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HEALTH_SCORE_QUESTIONS } from '@/hooks/useHealthScore';
import { useHealthScoreContext } from '@/contexts/HealthScoreContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { toast } from 'sonner';
import { ClipboardCheck, ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface HealthScoreQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
}

export default function HealthScoreQuestionnaire({ isOpen, onClose, accountId: initialAccountId }: HealthScoreQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || '');
  
  const { submitResponse } = useHealthScoreContext();
  const { accounts, updateAccount } = useAccountsContext();

  const progress = ((currentQuestion + 1) / HEALTH_SCORE_QUESTIONS.length) * 100;
  const question = HEALTH_SCORE_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === HEALTH_SCORE_QUESTIONS.length - 1;
  const canProceed = responses[question.id] !== undefined;

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (!selectedAccountId) {
      toast.error('Selecione um cliente antes de enviar');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) {
      toast.error('Cliente não encontrado');
      return;
    }

    try {
      const result = submitResponse(selectedAccountId, responses, 'Current User'); // TODO: Get actual user
      
      // Mapear classification para healthStatus e status do pipeline
      let healthStatus: 'healthy' | 'at-risk' | 'critical' = 'healthy';
      let pipelineStatus = 'Saudável';
      
      if (result.classification === 'champion' || result.classification === 'healthy') {
        healthStatus = 'healthy';
        pipelineStatus = 'Saudável';
      } else if (result.classification === 'attention') {
        healthStatus = 'at-risk';
        pipelineStatus = 'Atenção';
      } else { // at-risk ou critical
        healthStatus = 'critical';
        pipelineStatus = 'Crítico';
      }
      
      // Atualizar account com health score, health status e status do pipeline
      console.log('🔄 Atualizando account:', selectedAccountId, {
        healthScore: result.totalScore,
        healthStatus,
        status: pipelineStatus
      });
      
      updateAccount(selectedAccountId, { 
        healthScore: result.totalScore,
        healthStatus,
        status: pipelineStatus
      });
      
      console.log('✅ Account atualizado com sucesso');
      
      toast.success(`Health Score atualizado!`, {
        description: `Score: ${result.totalScore}/100 - ${getClassificationLabel(result.classification)}`,
      });

      // Reset
      setCurrentQuestion(0);
      setResponses({});
      setSelectedAccountId('');
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar Health Score');
      console.error(error);
    }
  };

  const getClassificationLabel = (classification: string) => {
    const labels: Record<string, string> = {
      champion: 'Cliente Campeão',
      healthy: 'Saudável',
      attention: 'Atenção',
      'at-risk': 'Em Risco',
      critical: 'Crítico',
    };
    return labels[classification] || classification;
  };

  const getPilarColor = (pilar: string) => {
    const colors: Record<string, string> = {
      'Adoção e Engajamento': 'text-blue-600',
      'Percepção de Valor': 'text-green-600',
      'Relacionamento e Satisfação': 'text-purple-600',
      'Saúde Operacional': 'text-orange-600',
      'Potencial de Crescimento': 'text-pink-600',
    };
    return colors[pilar] || 'text-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Questionário de Health Score</DialogTitle>
              <DialogDescription>
                Avaliação semanal de saúde do cliente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Seleção de cliente (se não foi passado accountId) */}
        {!initialAccountId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Selecione o cliente *</Label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione um cliente...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Pergunta {currentQuestion + 1} de {HEALTH_SCORE_QUESTIONS.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Pilar badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">PILAR:</span>
          <span className={`text-sm font-semibold ${getPilarColor(question.pilar)}`}>
            {question.pilar}
          </span>
        </div>

        {/* Pergunta */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold leading-relaxed">
            {question.question}
          </h3>

          <RadioGroup
            value={responses[question.id]?.toString()}
            onValueChange={(value) => {
              setResponses({
                ...responses,
                [question.id]: parseInt(value),
              });
            }}
          >
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent ${
                    responses[question.id] === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                  onClick={() => {
                    setResponses({
                      ...responses,
                      [question.id]: option.value,
                    });
                  }}
                >
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label
                    htmlFor={`option-${option.value}`}
                    className="flex-1 cursor-pointer font-normal leading-relaxed"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navegação */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || (!initialAccountId && !selectedAccountId)}
          >
            {isLastQuestion ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Avaliação
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Resumo das respostas */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Respostas: {Object.keys(responses).length} de {HEALTH_SCORE_QUESTIONS.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

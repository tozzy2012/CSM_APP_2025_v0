import React, { createContext, useContext, ReactNode } from "react";
import axios from "axios";
import { HEALTH_SCORE_QUESTIONS } from "@/hooks/useHealthScore";

interface HealthScoreContextType {
  submitResponse: (
    accountId: string,
    responses: Record<number, number>,
    evaluator: string
  ) => Promise<{
    totalScore: number;
    classification: string;
  }>;
}

const HealthScoreContext = createContext<HealthScoreContextType | undefined>(undefined);

export const HealthScoreProvider = ({ children }: { children: ReactNode }) => {
  const submitResponse = async (
    accountId: string,
    responses: Record<number, number>,
    evaluator: string
  ): Promise<{ totalScore: number; classification: string }> => {
    // Calcular score localmente para feedback imediato
    const scores = Object.values(responses);
    const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    // Determinar classificação
    let classification = 'critical';
    if (totalScore >= 90) classification = 'champion';
    else if (totalScore >= 70) classification = 'healthy';
    else if (totalScore >= 50) classification = 'attention';
    else if (totalScore >= 30) classification = 'at-risk';

    // Salvar no backend (converte keys de number para string para JSON)
    try {
      const responsesForApi: Record<string, number> = {};
      Object.entries(responses).forEach(([key, value]) => {
        responsesForApi[key] = value;
      });

      await axios.post('/api/v1/health-scores', {
        accountId,
        responses: responsesForApi,
        evaluatedBy: evaluator,
      });

      console.log('✅ Health score evaluation saved to backend');
    } catch (error) {
      console.error('❌ Error saving health score evaluation:', error);
      throw error;
    }

    return { totalScore, classification };
  };

  return (
    <HealthScoreContext.Provider value={{ submitResponse }}>
      {children}
    </HealthScoreContext.Provider>
  );
};

export const useHealthScoreContext = () => {
  const context = useContext(HealthScoreContext);
  if (!context) {
    throw new Error("useHealthScoreContext must be used within HealthScoreProvider");
  }
  return context;
};

export const useHealthScore = useHealthScoreContext;
export default HealthScoreContext;

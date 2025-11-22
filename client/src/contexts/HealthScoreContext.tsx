import React, { createContext, useContext, ReactNode } from "react";

interface HealthScoreContextType {
  submitResponse: (
    accountId: string,
    responses: Record<number, number>,
    evaluator: string
  ) => {
    totalScore: number;
    classification: string;
  };
}

const HealthScoreContext = createContext<HealthScoreContextType | undefined>(undefined);

export const HealthScoreProvider = ({ children }: { children: ReactNode }) => {
  const submitResponse = (
    accountId: string,
    responses: Record<number, number>,
    evaluator: string
  ) => {
    // Calcular score baseado nas respostas
    const scores = Object.values(responses);
    const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Classificar baseado no score
    let classification = 'critical';
    if (totalScore >= 90) classification = 'champion';
    else if (totalScore >= 70) classification = 'healthy';
    else if (totalScore >= 50) classification = 'attention';
    else if (totalScore >= 30) classification = 'at-risk';

    return {
      totalScore: Math.round(totalScore),
      classification,
    };
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

import React, { createContext, useContext, ReactNode } from 'react';
import { useHealthScore, HealthScoreResponse, HealthScoreWeights, WEIGHT_PROFILES } from '../hooks/useHealthScore';

interface HealthScoreContextType {
  responses: HealthScoreResponse[];
  weights: HealthScoreWeights;
  submitResponse: (accountId: string, responseData: Record<number, number>, submittedBy: string) => HealthScoreResponse;
  getAccountResponses: (accountId: string) => HealthScoreResponse[];
  getLatestScore: (accountId: string) => HealthScoreResponse | null;
  saveWeights: (weights: HealthScoreWeights) => void;
  applyWeightProfile: (profileKey: keyof typeof WEIGHT_PROFILES) => void;
}

const HealthScoreContext = createContext<HealthScoreContextType | undefined>(undefined);

export function HealthScoreProvider({ children }: { children: ReactNode }) {
  const healthScore = useHealthScore();

  return (
    <HealthScoreContext.Provider value={healthScore}>
      {children}
    </HealthScoreContext.Provider>
  );
}

export function useHealthScoreContext() {
  const context = useContext(HealthScoreContext);
  if (!context) {
    throw new Error('useHealthScoreContext must be used within HealthScoreProvider');
  }
  return context;
}

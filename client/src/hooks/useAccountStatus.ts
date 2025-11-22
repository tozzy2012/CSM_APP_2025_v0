import { useState } from "react";

export interface AccountStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

export function useAccountStatus() {
  const [statuses] = useState<AccountStatus[]>([
    { id: "1", name: "Saudável", color: "green", order: 1 },
    { id: "2", name: "Atenção", color: "yellow", order: 2 },
    { id: "3", name: "Crítico", color: "red", order: 3 },
    { id: "4", name: "Salvamento", color: "orange", order: 4 },
    { id: "5", name: "Upsell", color: "blue", order: 5 },
    { id: "6", name: "Churn", color: "gray", order: 6 },
    { id: "7", name: "Inadimplente", color: "purple", order: 7 },
  ]);

  return {
    statuses,
  };
}

  if (normalizedScore >= 90) classification = 'champion';
  else if (normalizedScore >= 70) classification = 'healthy';
  else if (normalizedScore >= 50) classification = 'attention';
  else if (normalizedScore >= 30) classification = 'at-risk';
  else classification = 'critical';

  return { score: Math.round(normalizedScore), classification };
}

export function useHealthScore() {
  const [responses, setResponses] = useState<HealthScoreResponse[]>([]);
  const [weights, setWeights] = useState<HealthScoreWeights>(DEFAULT_WEIGHTS);

  useEffect(() => {
    const stored = localStorage.getItem('zapper_health_scores');
import { useState, useEffect } from 'react';
import axios from 'axios';

interface HealthScoreEvaluation {
    id: string;
    accountId: string;
    evaluatedBy: string;
    evaluationDate: string;
    totalScore: number;
    classification: string;
    responses: Record<string, number>;
    pilarScores?: Record<string, number>;
}

export function useHealthScoreDetails(accountId: string | undefined) {
    const [evaluation, setEvaluation] = useState<HealthScoreEvaluation | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accountId) {
            setLoading(false);
            return;
        }

        const fetchEvaluation = async () => {
            try {
                setLoading(true);
                const response = await axios.get<HealthScoreEvaluation[]>(
                    `/api/v1/accounts/${accountId}/health-scores?limit=1`
                );

                if (response.data && response.data.length > 0) {
                    setEvaluation(response.data[0]);
                } else {
                    setEvaluation(null);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching health score details:', err);
                setError('Failed to fetch health score details');
                setEvaluation(null);
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [accountId]);

    return { evaluation, loading, error };
}

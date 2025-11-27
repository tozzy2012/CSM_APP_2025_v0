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

export function useLatestHealthScore(accountId: string | undefined) {
    const [score, setScore] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accountId) {
            setLoading(false);
            return;
        }

        const fetchLatestScore = async () => {
            try {
                setLoading(true);
                const response = await axios.get<HealthScoreEvaluation[]>(
                    `/api/v1/accounts/${accountId}/health-scores?limit=1`
                );

                if (response.data && response.data.length > 0) {
                    setScore(response.data[0].totalScore);
                } else {
                    setScore(0);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching health score:', err);
                setError('Failed to fetch health score');
                setScore(0);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestScore();
    }, [accountId]);

    return { score, loading, error };
}
